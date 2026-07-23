import { backupDocumentAsPdf } from '../services/smsService.js';
import asyncHandler from 'express-async-handler';
import Quotation from '../models/Quotation.js';
import { createAuditLog } from '../utils/auditLogger.js';

/**
 * @desc    Create a quotation from an inquiry
 * @route   POST /api/quotations
 * @access  Private
 */
export const createQuotation = asyncHandler(async (req, res) => {
    if (req.body.customerId === '') delete req.body.customerId;

    if (Array.isArray(req.body.items)) {
        req.body.items = req.body.items.map(item => {
            if (!item.product || item.product === '') {
                delete item.product;
            }
            return item;
        });
    }

    // Auto-register unregistered customer if customerName is provided but customerId is not
    if (!req.body.customerId && req.body.customerName) {
        const { default: Customer } = await import('../models/Customer.js');
        let customer = await Customer.findOne({
            displayName: { $regex: new RegExp('^' + req.body.customerName.trim() + '$', 'i') }
        });
        if (!customer) {
            customer = new Customer({
                displayName: req.body.customerName.trim(),
                companyName: req.body.customerName.trim(),
                primaryContact: {
                    email: req.body.customerEmail || undefined,
                    phone: req.body.customerPhone || undefined
                },
                billingAddress: req.body.customerAddress ? {
                    line1: req.body.customerAddress,
                    city: '',
                    country: 'Sri Lanka'
                } : undefined,
                status: 'active',
                createdBy: req.user._id
            });
            await customer.save();
        }
        req.body.customerId = customer._id;
    }

    if (!req.body.biller) req.body.biller = req.user._id;
    if (!req.body.billerName && req.user) {
        req.body.billerName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
    }

    const quotation = await Quotation.create({
        ...req.body,
        createdBy: req.user._id,
        version: 1
    });

    createAuditLog({
        action: 'create',
        module: 'crm',
        documentId: quotation._id,
        documentCode: quotation.quoteNumber,
        description: `Generated quotation ${quotation.quoteNumber}`,
        req
    });

    res.status(201).json({ success: true, data: quotation });
});

/**
 * @desc    Get quotations
 * @route   GET /api/quotations
 * @access  Private
 */
export const getQuotations = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { deletedAt: null };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [quotations, total] = await Promise.all([
        Quotation.find(filter)
            .populate('customerId', 'displayName companyName introducer introducerName')
            .populate('introducer', 'firstName lastName callingName employeeCode')
            .populate('biller', 'firstName lastName')
            .populate('items.product', 'name productCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Quotation.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: quotations,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
    });
});

/**
 * @desc    Get quotation by ID
 * @route   GET /api/quotations/:id
 * @access  Private
 */
export const getQuotationById = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findById(req.params.id)
        .populate('customerId', 'displayName companyName primaryContact billingAddress introducer introducerName')
        .populate('introducer', 'firstName lastName callingName employeeCode designation')
        .populate('biller', 'firstName lastName')
        .populate('items.product', 'name productCode uom basePrice sku')
        .populate('createdBy', 'firstName lastName');

    if (!quotation) {
        res.status(404);
        throw new Error('Quotation not found');
    }

    res.json({ success: true, data: quotation });
});

/**
 * @desc    Update a quotation
 * @route   PUT /api/crm/quotations/:id
 * @access  Private
 */
export const updateQuotation = asyncHandler(async (req, res) => {
    if (req.body.customerId === '') delete req.body.customerId;

    if (Array.isArray(req.body.items)) {
        req.body.items = req.body.items.map(item => {
            if (!item.product || item.product === '') {
                delete item.product;
            }
            return item;
        });
    }

    // Auto-register unregistered customer if customerName is provided but customerId is not
    if (!req.body.customerId && req.body.customerName) {
        const { default: Customer } = await import('../models/Customer.js');
        let customer = await Customer.findOne({
            displayName: { $regex: new RegExp('^' + req.body.customerName.trim() + '$', 'i') }
        });
        if (!customer) {
            customer = new Customer({
                displayName: req.body.customerName.trim(),
                companyName: req.body.customerName.trim(),
                primaryContact: {
                    email: req.body.customerEmail || undefined,
                    phone: req.body.customerPhone || undefined
                },
                billingAddress: req.body.customerAddress ? {
                    line1: req.body.customerAddress,
                    city: '',
                    country: 'Sri Lanka'
                } : undefined,
                status: 'active',
                createdBy: req.user._id
            });
            await customer.save();
        }
        req.body.customerId = customer._id;
    }

    const quotation = await Quotation.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.user._id },
        { new: true, runValidators: true }
    );

    if (!quotation) {
        res.status(404);
        throw new Error('Quotation not found');
    }

    createAuditLog({
        action: 'update',
        module: 'crm',
        documentId: quotation._id,
        description: `Updated quotation ${quotation.quoteNumber}`,
        req
    });

    res.json({ success: true, data: quotation });
});

/**
 * @desc    Delete a quotation (soft)
 * @route   DELETE /api/crm/quotations/:id
 * @access  Private
 */
export const deleteQuotation = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
        res.status(404);
        throw new Error('Quotation not found');
    }
    quotation.deletedAt = new Date();
    await quotation.save();

    createAuditLog({
        action: 'delete',
        module: 'crm',
        documentId: quotation._id,
        description: `Deleted quotation ${quotation.quoteNumber}`,
        req
    });

    res.json({ success: true, message: 'Quotation deleted' });
});

/**
 * @desc    Convert quotation or estimate to invoice
 * @route   POST /api/crm/quotations/:id/convert-to-invoice
 * @access  Private
 */
export const convertQuotationToInvoice = asyncHandler(async (req, res) => {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
        res.status(404);
        throw new Error('Document not found');
    }

    if (quotation.status === 'converted' && quotation.convertedInvoiceId) {
        // Return existing invoice
        const { default: Invoice } = await import('../models/Invoice.js');
        const existingInvoice = await Invoice.findById(quotation.convertedInvoiceId);
        if (existingInvoice) {
            return res.json({ success: true, message: 'Already converted', data: existingInvoice });
        }
    }

    const { default: Invoice } = await import('../models/Invoice.js');

    const invoiceItems = (quotation.items || []).map((item, index) => ({
        lineNumber: index + 1,
        productId: item.product || undefined,
        productName: item.productName || 'Custom Line Item',
        description: item.description || '',
        quantity: item.quantity || 1,
        unitOfMeasure: 'pcs',
        unitPrice: item.unitPrice || 0,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        taxable: false,
        lineSubtotal: (item.quantity || 1) * (item.unitPrice || 0),
        lineTotal: item.subtotal || ((item.quantity || 1) * (item.unitPrice || 0))
    }));

    const invoice = new Invoice({
        sourceDocumentType: quotation.documentType || 'quotation',
        sourceDocumentId: quotation._id,
        sourceDocumentCode: quotation.quoteNumber || quotation.quotationCode,

        insuranceCompany: quotation.insuranceCompany || '',
        vehicleOwner: quotation.vehicleOwner || quotation.customerName || '',
        vehicleNo: quotation.vehicleNo || '',
        vehicleModel: quotation.vehicleModel || '',
        jobCaption: quotation.jobCaption || '',
        salesRep: quotation.salesRep || '',
        introducer: quotation.introducer || undefined,
        introducerName: quotation.introducerName || '',
        biller: quotation.biller || undefined,
        billerName: quotation.billerName || '',
        branch: quotation.branch || 'JA-ELA',

        numberPlateImage: quotation.numberPlateImage || '',
        lorryBodyImage: quotation.lorryBodyImage || '',

        bodyDimensions: quotation.bodyDimensions || { length: '', width: '', height: '' },
        specifications: quotation.specifications || [],
        warrantyInfo: quotation.warrantyInfo || '',
        paymentConditions: quotation.paymentConditions || [],

        customerId: quotation.customerId || undefined,
        customerSnapshot: {
            name: quotation.customerName || 'Walk-in Customer',
            code: quotation.customerEmail || '',
            contactName: quotation.customerPhone || ''
        },
        billingAddress: {
            line1: quotation.customerAddress || ''
        },

        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
        items: invoiceItems,
        subtotal: quotation.totalAmount || quotation.grandTotal || 0,
        totalDiscount: quotation.discount || 0,
        totalTax: quotation.tax || 0,
        grandTotal: quotation.grandTotal || 0,
        notes: quotation.notes || `Converted from ${quotation.documentType || 'quotation'} ${quotation.quoteNumber}`,

        status: 'approved',
        paymentStatus: 'unpaid',
        createdBy: req.user._id
    });

    await invoice.save();

    quotation.status = 'converted';
    quotation.convertedInvoiceId = invoice._id;
    await quotation.save();

    createAuditLog({
        action: 'create',
        module: 'invoices',
        documentId: invoice._id,
        documentCode: invoice.invoiceNumber,
        description: `Converted ${quotation.documentType || 'quotation'} ${quotation.quoteNumber} to Invoice ${invoice.invoiceNumber}`,
        req
    });

    res.status(201).json({ success: true, message: 'Converted to Invoice successfully', data: invoice });
});

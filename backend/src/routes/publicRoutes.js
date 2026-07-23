import express from 'express';
import asyncHandler from 'express-async-handler';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

/**
 * GET /api/public/documents/:token
 * Fetch quotation/invoice details passwordless using a unique token
 */
router.get('/documents/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;

    // Search Quotation
    let doc = await Quotation.findOne({ publicToken: token });
    if (doc) {
        return res.json({
            success: true,
            documentType: doc.documentType || 'quotation',
            data: doc
        });
    }

    // Search Invoice
    doc = await Invoice.findOne({ publicToken: token });
    if (doc) {
        return res.json({
            success: true,
            documentType: 'invoice',
            data: doc
        });
    }

    res.status(404);
    throw new Error('Document not found');
}));

export default router;

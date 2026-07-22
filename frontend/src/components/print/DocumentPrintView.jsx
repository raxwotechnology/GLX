import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is Stop)
];

const Barcode128 = ({ value, width = 1.5, height = 50 }) => {
    if (!value) return null;
    const text = String(value).toUpperCase();
    let sum = 104;
    const codes = [104];
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i) - 32;
        codes.push(code);
        sum += code * (i + 1);
    }
    const checksum = sum % 103;
    codes.push(checksum);
    codes.push(106);
    let patternString = "";
    for (const code of codes) {
        if (code >= 0 && code <= 106) {
            patternString += CODE128_PATTERNS[code];
        }
    }
    const rects = [];
    let currentX = 0;
    for (let i = 0; i < patternString.length; i++) {
        const w = parseInt(patternString[i], 10);
        if (i % 2 === 0) {
            rects.push(
                <rect 
                    key={i} 
                    x={currentX * width} 
                    y={0} 
                    width={w * width} 
                    height={height} 
                    fill="black" 
                />
            );
        }
        currentX += w;
    }
    const totalWidth = currentX * width;
    return (
        <svg width={totalWidth} height={height} viewBox={`0 0 ${totalWidth} ${height}`}>
            <g>{rects}</g>
        </svg>
    );
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(amount || 0);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
};

/**
 * Reusable Printable Document Component matching GLX TRUCK BODY ENGINEERS / ALUECO layout
 * Supports Quotation, Estimate, and Invoice
 */
const DocumentPrintView = forwardRef(({ document: doc, companyInfo }, ref) => {
    if (!doc) return null;

    const isEstimate = doc.documentType === 'estimate' || (doc.quoteNumber && doc.quoteNumber.startsWith('EST'));
    const isInvoice = !!doc.invoiceNumber || doc.documentType === 'invoice';
    const isQuotation = !isEstimate && !isInvoice;

    let docTitle = 'QUOTATION';
    if (isEstimate) docTitle = 'ESTIMATE';
    if (isInvoice) docTitle = 'INVOICE';

    const docNumber = doc.invoiceNumber || doc.quoteNumber || doc.quotationCode || 'N/A';
    const customerName = doc.customerName || doc.vehicleOwner || doc.customerSnapshot?.name || 'Valued Client';
    const contactPhone = doc.customerPhone || doc.customerSnapshot?.contactName || '';
    const dateDisplay = formatDate(doc.date || doc.invoiceDate || doc.createdAt);

    // Construct QR code data string containing full invoice/estimate details
    const qrDataObj = {
        type: docTitle,
        number: docNumber,
        date: dateDisplay,
        customer: customerName,
        vehicleNo: doc.vehicleNo || 'N/A',
        vehicleModel: doc.vehicleModel || 'N/A',
        grandTotal: doc.grandTotal || doc.finalSellingPrice || doc.totalAmount || 0,
        status: doc.status || 'Active',
        itemsCount: doc.items?.length || 0,
        items: (doc.items || []).map(i => ({
            desc: i.productName || i.applicationType || i.description || 'Item',
            qty: i.quantity || 1,
            total: i.lineTotal || i.totalPrice || i.subtotal || 0
        }))
    };
    const qrString = JSON.stringify(qrDataObj, null, 2);

    return (
        <div ref={ref} className="print-container bg-white text-gray-900 p-8 max-w-[850px] mx-auto text-sm leading-relaxed border border-gray-200 rounded-lg shadow-sm">
            {/* Top Company Header */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-gray-800 mb-4">
                <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center font-bold text-2xl rounded">
                        GLX
                    </div>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider text-gray-900">
                            {companyInfo?.name || 'GLX TRUCK BODY ENGINEERS'}
                        </h1>
                        <p className="text-xs font-semibold text-gray-600 uppercase">
                            ALUMINIUM, STEEL & FREEZER BOX MANUFACTURE
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            No.14, Negambo Road, Thudella, Ja-Ela, Sri Lanka (11350)
                            <br />
                            No.2020/3L, 2, Seeduwa Road, Kotugoda, Ja-Ela
                        </p>
                        <p className="text-xs text-gray-500">
                            Mobile: 071 6666 888 | Tel: 011 740 4446 | Email: glx.engi@gmail.com | Web: www.glx.lk
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-gray-900 text-white font-bold text-sm tracking-widest uppercase rounded">
                        {docTitle}
                    </span>
                    <p className="text-base font-bold font-mono text-gray-800 mt-2">{docNumber}</p>
                    <p className="text-xs text-gray-600 mt-1">Date: <span className="font-semibold">{dateDisplay}</span></p>
                </div>
            </div>

            {/* Document Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 text-xs">
                <div className="space-y-1">
                    {doc.insuranceCompany && (
                        <p><span className="font-semibold text-gray-700">Insurance Company:</span> {doc.insuranceCompany}</p>
                    )}
                    <p><span className="font-semibold text-gray-700">Vehicle Owner / Customer:</span> <strong className="text-gray-900">{customerName}</strong></p>
                    {contactPhone && (
                        <p><span className="font-semibold text-gray-700">Contact Number:</span> {contactPhone}</p>
                    )}
                    {(doc.introducerName || (doc.introducer && (doc.introducer.firstName || doc.introducer.name))) && (
                        <p><span className="font-semibold text-gray-700">Client Introducer:</span> <strong className="text-indigo-800">{doc.introducerName || `${doc.introducer?.firstName || ''} ${doc.introducer?.lastName || ''}`.trim()}</strong></p>
                    )}
                    {doc.vehicleNo && (
                        <p><span className="font-semibold text-gray-700">Vehicle No:</span> <strong className="text-blue-700 font-mono text-sm">{doc.vehicleNo}</strong></p>
                    )}
                    {doc.vehicleModel && (
                        <p><span className="font-semibold text-gray-700">Vehicle Model:</span> {doc.vehicleModel}</p>
                    )}
                </div>

                <div className="space-y-1 text-right">
                    {isEstimate ? (
                        <p><span className="font-semibold text-gray-700">Estimate No:</span> <span className="font-mono font-bold">{docNumber}</span></p>
                    ) : isQuotation ? (
                        <p><span className="font-semibold text-gray-700">Quotation No:</span> <span className="font-mono font-bold">{docNumber}</span></p>
                    ) : (
                        <p><span className="font-semibold text-gray-700">Invoice No:</span> <span className="font-mono font-bold">{docNumber}</span></p>
                    )}
                    <p><span className="font-semibold text-gray-700">Sales / Biller:</span> <strong className="text-gray-900">{doc.billerName || (doc.biller ? `${doc.biller.firstName} ${doc.biller.lastName || ''}`.trim() : (doc.salesRep || 'Asanka'))}</strong></p>
                    <p><span className="font-semibold text-gray-700">Branch:</span> {doc.branch || 'JA-ELA'}</p>
                    {doc.jobCaption && (
                        <p><span className="font-semibold text-gray-700">Job Caption:</span> <span className="font-semibold">{doc.jobCaption}</span></p>
                    )}
                </div>
            </div>

            {/* RMB Dimensions & Specifications (If present) */}
            {(doc.bodyDimensions?.length || doc.specifications?.length > 0) && (
                <div className="mb-6 bg-blue-50/50 p-3 rounded border border-blue-100 text-xs">
                    {doc.bodyDimensions?.length && (
                        <div className="mb-2">
                            <p className="font-bold text-gray-800 uppercase">ORIGINAL RMB Outside Body Dimensions:</p>
                            <p className="text-gray-700">
                                Length - {doc.bodyDimensions.length || '8 Feet 5 Inch'} | Width - {doc.bodyDimensions.width || '67 Inch'} | Height - {doc.bodyDimensions.height || '5 Feet 6 Inch'}
                            </p>
                        </div>
                    )}
                    {doc.specifications?.length > 0 && (
                        <div>
                            <p className="font-bold text-gray-800 uppercase mb-1">Body Specifications:</p>
                            <ol className="list-decimal list-inside grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                                {doc.specifications.map((spec, idx) => (
                                    <li key={idx}>{spec}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            {/* Line Items Table */}
            <div className="mb-6 overflow-hidden border border-gray-300 rounded">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-gray-800 text-white uppercase text-[10px] tracking-wider">
                        <tr>
                            <th className="py-2.5 px-3 w-8 text-center">#</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-right w-20">Rate</th>
                            <th className="py-2.5 px-3 text-center w-14">Qty</th>
                            <th className="py-2.5 px-3 text-right w-28">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {(doc.items || []).map((item, idx) => {
                            const desc = item.productName || item.applicationType || item.description || 'Line item';
                            const qty = item.quantity || 1;
                            const unitPrice = item.unitPrice || item.rate || 0;
                            const lineTotal = item.lineTotal || item.totalPrice || item.subtotal || (qty * unitPrice);

                            return (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="py-2 px-3 text-center font-medium text-gray-500">{idx + 1}</td>
                                    <td className="py-2 px-3 font-medium text-gray-800">
                                        <div>{desc}</div>
                                        {item.configuration && (
                                            <div className="text-[11px] text-gray-500">{item.configuration} ({item.width} x {item.height} mm)</div>
                                        )}
                                        {item.notes && <div className="text-[10px] text-gray-400 italic">{item.notes}</div>}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-gray-700">{formatCurrency(unitPrice)}</td>
                                    <td className="py-2 px-3 text-center font-semibold text-gray-800">{qty}</td>
                                    <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(lineTotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end mb-6">
                <div className="w-72 bg-gray-50 border border-gray-300 rounded p-3 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-700">
                        <span>SUB TOTAL:</span>
                        <span className="font-mono">{formatCurrency(doc.subtotal || doc.totalAmount || doc.calculatedSellingPrice || doc.grandTotal)}</span>
                    </div>
                    {doc.discount > 0 && (
                        <div className="flex justify-between text-red-600 font-medium">
                            <span>DISCOUNT:</span>
                            <span className="font-mono">-{formatCurrency(doc.discount)}</span>
                        </div>
                    )}
                    {doc.shippingCost > 0 && (
                        <div className="flex justify-between text-gray-700">
                            <span>TRANSPORT / SHIPPING:</span>
                            <span className="font-mono">{formatCurrency(doc.shippingCost)}</span>
                        </div>
                    )}
                    {doc.tax > 0 && (
                        <div className="flex justify-between text-gray-700">
                            <span>TAX / VAT:</span>
                            <span className="font-mono">{formatCurrency(doc.tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-400">
                        <span>GRAND TOTAL:</span>
                        <span className="font-mono text-blue-800">{formatCurrency(doc.grandTotal || doc.finalSellingPrice || doc.totalAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Payment & Warranty Terms */}
            <div className="mb-6 grid grid-cols-2 gap-4 text-xs text-gray-700">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="font-bold text-gray-900 uppercase mb-1">Condition of Payments:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                        <li>a). 70% Advance Payment with the firm Order.</li>
                        <li>b). Balance Payment on Completion of Work.</li>
                        <li>Validity: Valid for 30 Working Days / 2 Weeks from Issued Date.</li>
                    </ul>
                </div>

                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="font-bold text-gray-900 uppercase mb-1">Warranty & Notes:</p>
                    <p className="text-gray-600 mb-1">{doc.warrantyInfo || 'a). Please see description. b). Warranty will be issued with the final Invoice.'}</p>
                    <p className="text-[10px] text-gray-500 italic">Every 12 Months you should come to GLX Yard for warranty check-up.</p>
                </div>
            </div>

            {/* Photo Attachments & Barcode/QR Code Section (Critical requirement) */}
            <div className="my-6 border-t-2 border-dashed border-gray-300 pt-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Verification & Attachments</h3>
                <div className="grid grid-cols-4 gap-4 items-end">
                    {/* Number Plate Photo */}
                    <div className="border border-gray-300 rounded p-2 bg-gray-50 text-center">
                        {doc.numberPlateImage ? (
                            <img src={doc.numberPlateImage} alt="Number Plate" className="h-32 object-contain mx-auto rounded border" />
                        ) : (
                            <div className="h-32 bg-gray-200 rounded flex flex-col items-center justify-center text-gray-500 text-xs">
                                <span className="font-bold font-mono text-sm">{doc.vehicleNo || 'NO PLATE'}</span>
                                <span className="text-[10px] text-gray-400 mt-1">[ Number Plate Photo ]</span>
                            </div>
                        )}
                        <p className="text-[11px] font-bold text-gray-800 mt-1 uppercase">Number Plate Photo</p>
                    </div>

                    {/* Lorry Body Photo */}
                    <div className="border border-gray-300 rounded p-2 bg-gray-50 text-center">
                        {doc.lorryBodyImage ? (
                            <img src={doc.lorryBodyImage} alt="Lorry Body" className="h-32 object-contain mx-auto rounded border" />
                        ) : (
                            <div className="h-32 bg-gray-200 rounded flex flex-col items-center justify-center text-gray-500 text-xs">
                                <span className="font-bold text-sm">LORRY BODY</span>
                                <span className="text-[10px] text-gray-400 mt-1">[ Body Photo ]</span>
                            </div>
                        )}
                        <p className="text-[11px] font-bold text-gray-800 mt-1 uppercase">Lorry Body Photo</p>
                    </div>

                    {/* QR Code */}
                    <div className="border border-gray-300 rounded p-2 bg-white text-center flex flex-col items-center justify-center h-full min-h-[160px]">
                        <div className="bg-white p-1 rounded shadow-inner border">
                            <QRCodeSVG value={qrString} size={85} level="M" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-700 mt-1.5 uppercase">Scan QR Code</p>
                        <p className="text-[9px] text-gray-400 font-mono">{docNumber}</p>
                    </div>

                    {/* Barcode */}
                    <div className="border border-gray-300 rounded p-2 bg-white text-center flex flex-col items-center justify-center h-full min-h-[160px]">
                        <div className="bg-white p-1 flex items-center justify-center border h-20 w-full">
                            <Barcode128 value={docNumber} width={1.0} height={60} />
                        </div>
                        <p className="text-[10px] font-bold text-gray-700 mt-1.5 uppercase">Scan Barcode</p>
                        <p className="text-[9px] text-gray-400 font-mono">{docNumber}</p>
                    </div>
                </div>
            </div>

            {/* Authorized Person Signature */}
            <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between items-end text-xs">
                <div>
                    <p className="text-gray-500 text-[10px]">Printed at: {new Date().toLocaleString('en-GB')}</p>
                </div>

                <div className="text-center w-56">
                    <div className="border-b border-gray-800 mb-1 h-8"></div>
                    <p className="font-bold text-gray-900 uppercase">GLX INDUSTRIES - Ja Ela</p>
                    <p className="text-gray-600 text-[11px]">Authorized Person Signature</p>
                </div>
            </div>
        </div>
    );
});

DocumentPrintView.displayName = 'DocumentPrintView';
export default DocumentPrintView;

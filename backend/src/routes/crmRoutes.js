import express from 'express';
import {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    convertQuotationToInvoice
} from '../controllers/quotationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// ── Quotation Routes ───────────────────────────────────────────────────────────
router.get('/quotations',       getQuotations);
router.get('/quotations/:id',   getQuotationById);
router.post('/quotations',      createQuotation);
router.put('/quotations/:id',   updateQuotation);
router.delete('/quotations/:id', deleteQuotation);
router.post('/quotations/:id/convert-to-invoice', convertQuotationToInvoice);

export default router;

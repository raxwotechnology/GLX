import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getProfiles, createProfile, updateProfile, deleteProfile,
    getGlass, createGlass, updateGlass, deleteGlass,
    getAccessories, createAccessory, updateAccessory, deleteAccessory,
    getApplications, createApplication, updateApplication, deleteApplication,
    getScraps, createScrap, updateScrap, deleteScrap,
    getJobCards, updateJobCardStatus,
    getSurveys, createSurvey, updateSurvey, deleteSurvey
} from '../controllers/aluController.js';
import {
    getAluQuotations, getAluQuotationById, createAluQuotation,
    updateAluQuotation, deleteAluQuotation, reviseAluQuotation,
    convertAluQuotationToOrder, exportAluQuotationToCNC
} from '../controllers/aluQuotationController.js';

const router = express.Router();

// Apply auth protection middleware to all aluminium endpoints
router.use(protect);

// Profiles CRUD
router.route('/profiles')
    .get(getProfiles)
    .post(createProfile);
router.route('/profiles/:id')
    .put(updateProfile)
    .delete(deleteProfile);

// Glass CRUD
router.route('/glass')
    .get(getGlass)
    .post(createGlass);
router.route('/glass/:id')
    .put(updateGlass)
    .delete(deleteGlass);

// Accessories CRUD
router.route('/accessories')
    .get(getAccessories)
    .post(createAccessory);
router.route('/accessories/:id')
    .put(updateAccessory)
    .delete(deleteAccessory);

// Application Templates CRUD
router.route('/applications')
    .get(getApplications)
    .post(createApplication);
router.route('/applications/:id')
    .put(updateApplication)
    .delete(deleteApplication);

// Quotation Operations
router.route('/quotations')
    .get(getAluQuotations)
    .post(createAluQuotation);
router.route('/quotations/:id')
    .get(getAluQuotationById)
    .put(updateAluQuotation)
    .delete(deleteAluQuotation);
router.post('/quotations/:id/revise', reviseAluQuotation);
router.post('/quotations/:id/convert-to-order', convertAluQuotationToOrder);
router.post('/quotations/:id/cnc-export', exportAluQuotationToCNC);

// Scrap Inventory CRUD
router.route('/scrap')
    .get(getScraps)
    .post(createScrap);
router.route('/scrap/:id')
    .put(updateScrap)
    .delete(deleteScrap);

// Job Cards Kanban
router.route('/job-cards')
    .get(getJobCards);
router.route('/job-cards/:id/status')
    .put(updateJobCardStatus);

// On-Site surveys
router.route('/surveys')
    .get(getSurveys)
    .post(createSurvey);
router.route('/surveys/:id')
    .put(updateSurvey)
    .delete(deleteSurvey);

export default router;

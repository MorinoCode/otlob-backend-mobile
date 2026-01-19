import express from 'express';
import { addVendor, getNearby, getStats } from '../controllers/vendorController.js';

const router = express.Router();

// POST /api/vendors (فقط برای تست اولیه باز میذاریم تا رستوران بسازیم)
router.post('/', addVendor);

// GET /api/vendors/nearby?lat=...&long=...
router.get('/nearby', getNearby);

router.get('/:vendorId/stats', getStats);

export default router;
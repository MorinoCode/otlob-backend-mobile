import express from 'express';
import { addVendor, getNearby, getStats, loginVendor, getAllVendors, getVendorOrders, updateVendorOrderStatus, getVendorCompletedOrders, getVendorDetails } from '../controllers/vendorController.js';
import { verifyVendor } from '../middlewares/vendorAuthMiddleware.js';

const router = express.Router();

router.post('/', addVendor);
router.post('/login', loginVendor);
router.get('/all', getAllVendors);
router.get('/nearby', getNearby);
router.get('/:vendorId', getVendorDetails);
router.get('/:vendorId/stats', verifyVendor, getStats);
router.get('/:vendorId/orders', verifyVendor, getVendorOrders);
router.get('/:vendorId/orders/completed', verifyVendor, getVendorCompletedOrders);
router.patch('/:vendorId/orders/:orderId/status', verifyVendor, updateVendorOrderStatus);

export default router;
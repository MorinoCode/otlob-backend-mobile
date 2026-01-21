import express from 'express';
import * as vendorRequestController from '../controllers/vendorRequestController.js';
import { verifyAdmin } from '../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// ========================================
// Public Routes
// ========================================
router.post('/', vendorRequestController.createVendorRequest); // ایجاد درخواست جدید

// ========================================
// Protected Routes (Admin Only)
// ========================================
router.use(verifyAdmin);

router.get('/', vendorRequestController.getAllVendorRequests); // لیست همه درخواست‌ها
router.get('/:requestId', vendorRequestController.getVendorRequestById); // جزئیات درخواست
router.patch('/:requestId/status', vendorRequestController.updateVendorRequestStatus); // به‌روزرسانی وضعیت
router.delete('/:requestId', vendorRequestController.deleteVendorRequest); // حذف درخواست

export default router;

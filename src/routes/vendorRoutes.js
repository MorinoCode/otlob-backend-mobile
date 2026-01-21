import express from 'express';
import { addVendor, getNearby, getStats, loginVendor, getAllVendors, getVendorOrders, updateVendorOrderStatus, getVendorCompletedOrders, getVendorDetails } from '../controllers/vendorController.js';
import { verifyVendor } from '../middlewares/vendorAuthMiddleware.js';

const router = express.Router();

// ========================================
// Public Routes (برای Mobile App)
// ========================================
router.post('/', addVendor); // ثبت vendor جدید
router.post('/login', loginVendor); // ورود vendor
router.get('/all', getAllVendors); // لیست همه vendors
router.get('/nearby', getNearby); // vendors نزدیک

// ========================================
// Vendor Details (Public - اما با جزئیات کمتر)
// ========================================
router.get('/:vendorId', getVendorDetails); // جزئیات vendor

// ========================================
// Protected Routes (نیاز به Vendor Authentication)
// ========================================
// توجه: این routes باید بعد از static routes باشند
router.get('/:vendorId/stats', verifyVendor, getStats); // آمار فروش
router.get('/:vendorId/orders', verifyVendor, getVendorOrders); // سفارش‌های فعال
router.get('/:vendorId/orders/completed', verifyVendor, getVendorCompletedOrders); // سفارش‌های تکمیل شده
router.patch('/:vendorId/orders/:orderId/status', verifyVendor, updateVendorOrderStatus); // تغییر وضعیت سفارش

export default router;
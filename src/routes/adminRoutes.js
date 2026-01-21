import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { verifyAdmin, requireRole } from '../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// Public Routes
router.post('/login', adminController.loginAdmin);

// Protected Routes (نیاز به authentication)
router.use(verifyAdmin);

// ========================================
// Profile & Dashboard
// ========================================
router.get('/profile', adminController.getAdminProfile);
router.get('/dashboard/stats', adminController.getDashboardStats);

// ========================================
// Vendors Management
// ========================================
// لیست vendors باید قبل از /vendors/:vendorId باشد
router.get('/vendors', adminController.getAllVendorsForAdmin);
router.get('/vendors/:vendorId', adminController.getVendorById);
router.patch('/vendors/:vendorId', adminController.updateVendor);
router.patch('/vendors/:vendorId/status', adminController.toggleVendorStatus);
router.patch('/vendors/:vendorId/password', adminController.changeVendorPassword);
router.get('/vendors/:vendorId/menu', adminController.getVendorMenu);

// ========================================
// Users Management
// ========================================
// لیست users باید قبل از /users/:userId باشد
router.get('/users', adminController.getAllUsersForAdmin);
router.get('/users/:userId', adminController.getUserById);
router.patch('/users/:userId', adminController.updateUser);

// ========================================
// Orders Management
// ========================================
// لیست orders باید قبل از /orders/:orderId باشد
router.get('/orders', adminController.getAllOrdersForAdmin);
router.get('/orders/:orderId', adminController.getOrderById);

// ========================================
// Reports Management
// ========================================
// لیست reports باید قبل از /reports/:reportId باشد
router.get('/reports', adminController.getAllReports);
router.get('/reports/:reportId', adminController.getReportById);
router.patch('/reports/:reportId', adminController.updateReport);

// ========================================
// Admins Management (Super Admin Only)
// ========================================
// لیست admins باید قبل از /admins/:adminId باشد
router.get('/admins', requireRole('super_admin'), adminController.getAllAdmins);
router.post('/admins', requireRole('super_admin'), adminController.createAdmin);
router.patch('/admins/:adminId', requireRole('super_admin'), adminController.updateAdmin);
router.patch('/admins/:adminId/password', requireRole('super_admin'), adminController.changeAdminPassword);
router.delete('/admins/:adminId', requireRole('super_admin'), adminController.deleteAdmin);

export default router;

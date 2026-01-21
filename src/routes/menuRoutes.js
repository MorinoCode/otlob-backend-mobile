import express from 'express';
import { getVendorMenu, addItem } from '../controllers/menuController.js';

const router = express.Router({ mergeParams: true });
// mergeParams: true برای دسترسی به :vendorId از route والد

// ========================================
// Menu Management (Nested under /api/vendors/:vendorId/menu)
// ========================================
router.get('/', getVendorMenu); // GET /api/vendors/:vendorId/menu - دریافت منو
router.post('/', addItem); // POST /api/vendors/:vendorId/menu - اضافه کردن آیتم

export default router;
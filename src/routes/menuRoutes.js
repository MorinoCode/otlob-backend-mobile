import express from 'express';
import { getVendorMenu, addItem } from '../controllers/menuController.js';

const router = express.Router({ mergeParams: true }); 
// mergeParams: true baraye inke betonim ID restaurant ro az URL pedar begirim

router.get('/', getVendorMenu); // GET /api/vendors/:vendorId/menu
router.post('/', addItem);      // POST /api/vendors/:vendorId/menu

export default router;
import express from 'express';
import { updateItem } from '../controllers/menuController.js';

const router = express.Router();

// ========================================
// Menu Item Management
// ========================================
router.patch('/:itemId', updateItem); // PATCH /api/items/:itemId - ویرایش آیتم منو

export default router;
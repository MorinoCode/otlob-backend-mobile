import express from 'express';
import { updateItem } from '../controllers/menuController.js';

const router = express.Router();

// PATCH /api/items/:itemId
router.patch('/:itemId', updateItem);

export default router;
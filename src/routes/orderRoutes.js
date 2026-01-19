import express from 'express';
import { createOrder,updateOrderStatus,getMyOrders } from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createOrder); // فقط کاربران لاگین شده
router.patch('/:orderId/status', updateOrderStatus);
router.get('/my-orders', protect, getMyOrders);
export default router;
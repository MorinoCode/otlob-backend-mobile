import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

// 1. روت‌های ثابت (Static) اولویت دارند - نام روت را به /my تغییر دادیم
router.get('/my', orderController.getMyOrders);

// 2. روت‌های متغیر (Dynamic) در انتها
router.post('/', orderController.createOrder);
router.get('/:orderId', orderController.getOrderDetails); 
router.patch('/:orderId/status', orderController.updateOrderStatus);
router.post('/:orderId/rate', orderController.rateOrder); // روت جدید برای امتیاز
router.get('/:orderId/items', orderController.getOrderItemsList);
export default router;
import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// همه routes نیاز به authentication دارند
router.use(protect);

// ========================================
// Order Management (Mobile App - User)
// ========================================
// روت‌های static باید قبل از dynamic routes باشند
router.get('/my', orderController.getMyOrders); // لیست سفارش‌های من
router.post('/', orderController.createOrder); // ایجاد سفارش جدید

// روت‌های dynamic (با :orderId) در انتها
router.get('/:orderId', orderController.getOrderDetails); // جزئیات سفارش
router.get('/:orderId/items', orderController.getOrderItemsList); // لیست آیتم‌های سفارش
router.patch('/:orderId/status', orderController.updateOrderStatus); // تغییر وضعیت (برای کاربر)
router.post('/:orderId/rate', orderController.rateOrder); // امتیاز دادن به سفارش

export default router;
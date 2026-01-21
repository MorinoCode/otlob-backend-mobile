import express from 'express';
import { addUserCar, getMyCars, setDefaultCar } from '../controllers/carController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// همه routes نیاز به authentication دارند
router.use(protect);

// ========================================
// Car Management (Mobile App)
// ========================================
router.post('/', addUserCar); // اضافه کردن ماشین جدید
router.get('/', getMyCars); // دریافت لیست ماشین‌های کاربر
router.patch('/:id/set-default', setDefaultCar); // تنظیم ماشین پیش‌فرض

export default router;
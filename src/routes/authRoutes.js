import express from 'express';
import { sendOtp, verifyOtp, completeProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ========================================
// Authentication Routes (Public)
// ========================================
router.post('/send-otp', sendOtp); // ارسال کد OTP
router.post('/verify-otp', verifyOtp); // تایید OTP و دریافت token

// ========================================
// Profile Completion (Protected)
// ========================================
router.post('/complete-profile', protect, completeProfile); // تکمیل پروفایل کاربر

export default router;
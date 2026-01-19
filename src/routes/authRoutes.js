import express from 'express';
import { sendOtp,verifyOtp ,completeProfile} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/auth/login
// router.post('/login', loginOrRegister);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-profile', protect, completeProfile);

export default router;
import express from 'express';
import { addUserCar, getMyCars } from '../controllers/carController.js';
import { protect } from '../middlewares/authMiddleware.js'; // Negahban ro seda mizanim

const router = express.Router();

// Har 2 ta route bayad Protect beshan (yani faghat kasi ke login karde dastresi dare)
router.post('/', protect, addUserCar); // Ezafe kardane mashin
router.get('/', protect, getMyCars);   // Didane list mashin ha

export default router;
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import carRoutes from "./routes/carRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import vendorRequestRoutes from './routes/vendorRequestRoutes.js';

const app = express();

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ساخت پوشه uploads اگر وجود نداشته باشد
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static Folder (برای دسترسی به عکس‌های آپلود شده)
// این خط باعث می‌شود فایل‌های داخل پوشه uploads از طریق مرورگر قابل دسترسی باشند
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- Routes ---
// توجه: ترتیب routes مهم است - static routes قبل از dynamic routes

// Authentication & User Management
app.use('/api/auth', authRoutes);

// Car Management (Mobile App)
app.use('/api/cars', carRoutes);

// Vendor Routes (Public + Protected)
app.use('/api/vendors', vendorRoutes);

// Menu Routes (Nested under vendors - باید بعد از vendorRoutes باشد)
app.use('/api/vendors/:vendorId/menu', menuRoutes);

// Order Management (Mobile App)
app.use('/api/orders', orderRoutes);

// Menu Item Management
app.use('/api/items', itemRoutes);

// File Upload
app.use('/api/upload', uploadRoutes);

// Admin Panel Routes (باید در انتها باشد تا با vendor routes تداخل نداشته باشد)
app.use('/api/admin', adminRoutes);

// Vendor Registration Requests (Public + Admin)
app.use('/api/vendor-requests', vendorRequestRoutes);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message
  });
});

export default app;
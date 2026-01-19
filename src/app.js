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
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);

// روت تو در تو برای منوی یک رستوران خاص
app.use('/api/vendors/:vendorId/menu', menuRoutes);

// روت‌های مدیریت آیتم‌ها (ویرایش تکی)
app.use('/api/items', itemRoutes);

// روت آپلود فایل
app.use('/api/upload', uploadRoutes);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message
  });
});

export default app;
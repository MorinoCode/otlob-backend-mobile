import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// تنظیمات ذخیره‌سازی
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // پوشه مقصد
  },
  filename(req, file, cb) {
    // اسم فایل = زمان حال + اسم اصلی (برای جلوگیری از تکرار)
    // مثلا: 173849302-burger.jpg
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// فیلتر کردن فایل‌ها (فقط عکس قبول کنیم)
const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// روت آپلود
// نام فیلد در فرم باید 'image' باشد
router.post('/', upload.single('image'), (req, res) => {
  if (req.file) {
    // آدرس کامل عکس را برمی‌گردانیم
    // نکته: در حالت پروداکشن باید دامین واقعی را جایگزین localhost کنیم
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fullUrl });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

export default router;
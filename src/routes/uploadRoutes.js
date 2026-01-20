import express from 'express';
import upload from '../config/uploadConfig.js';

const router = express.Router();

router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({ url: fullUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
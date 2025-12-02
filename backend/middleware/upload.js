// backend/src/middleware/upload.middleware.js
import { upload, MAX_IMAGE_SIZE_MB } from '../config/multer.config.js';

export function uploadComplaintImages(req, res, next) {
  upload.array('images', 5)(req, res, function (err) {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `Image too large. Max size is ${MAX_IMAGE_SIZE_MB} MB per file.`,
      });
    }
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload error' });
    }
    next();
  });
}
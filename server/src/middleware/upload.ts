import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

const productsUploadDir = path.resolve(config.upload.dir, 'products');
if (!fs.existsSync(productsUploadDir)) {
  fs.mkdirSync(productsUploadDir, { recursive: true });
}

// Storage configuration with sanitized unique filename: product-<timestamp>-<random><ext>
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, productsUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${uniqueSuffix}-${sanitizedBase}${ext}`);
  },
});

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.'));
  }
};

const multerInstance = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize, // 5MB
  },
  fileFilter,
});

/**
 * Middleware for handling single product image upload ('image' field)
 * with user-friendly error handling for oversized files and invalid types.
 */
export const uploadListingImage = (req: Request, res: Response, next: NextFunction) => {
  const singleUpload = multerInstance.single('image');

  singleUpload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'Image file size exceeds the 5 MB limit.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      res.status(400).json({ error: err.message || 'Failed to upload image.' });
      return;
    }
    next();
  });
};

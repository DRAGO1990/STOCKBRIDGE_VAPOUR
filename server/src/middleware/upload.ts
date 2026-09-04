import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// ── Directories Setup ──
export const productsUploadDir = path.resolve(config.upload.dir, 'products');
if (!fs.existsSync(productsUploadDir)) {
  fs.mkdirSync(productsUploadDir, { recursive: true });
}

export const invoicesUploadDir = path.resolve(config.upload.dir, 'invoices');
if (!fs.existsSync(invoicesUploadDir)) {
  fs.mkdirSync(invoicesUploadDir, { recursive: true });
}

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

// ── Product Images Storage & Middleware ──
const productStorage = multer.diskStorage({
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

const productMulterInstance = multer({
  storage: productStorage,
  limits: {
    fileSize: config.upload.maxSize, // 5MB
  },
  fileFilter,
});

export const uploadListingImage = (req: Request, res: Response, next: NextFunction) => {
  const singleUpload = productMulterInstance.single('image');

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

// ── Invoice Images Storage & Middleware (Private) ──
const invoiceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, invoicesUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `invoice-${uniqueSuffix}-${sanitizedBase}${ext}`);
  },
});

const invoiceMulterInstance = multer({
  storage: invoiceStorage,
  limits: {
    fileSize: config.upload.maxSize, // 5MB
  },
  fileFilter,
});

export const uploadInvoiceImage = (req: Request, res: Response, next: NextFunction) => {
  const singleUpload = invoiceMulterInstance.single('invoice');

  singleUpload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'Invoice file size exceeds the 5 MB limit.' });
          return;
        }
        res.status(400).json({ error: `Upload error: ${err.message}` });
        return;
      }
      res.status(400).json({ error: err.message || 'Failed to upload invoice.' });
      return;
    }
    next();
  });
};

// ── File Cleanup Helpers ──
export const deleteLocalProductImage = (imageUrl?: string | null) => {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  if (!imageUrl.startsWith('/uploads/products/')) return;
  try {
    const filename = path.basename(imageUrl);
    const fullPath = path.resolve(productsUploadDir, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Failed to clean up product image:', err);
  }
};

export const deleteLocalInvoiceImage = (invoicePath?: string | null) => {
  if (!invoicePath || typeof invoicePath !== 'string') return;
  try {
    const filename = path.basename(invoicePath);
    const fullPath = path.resolve(invoicesUploadDir, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error('Failed to clean up invoice image:', err);
  }
};

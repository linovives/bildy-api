import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/AppError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const name = path.extname(file.originalname).toLowerCase();
    const uniqueName = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${name}`;
    cb(null, uniqueName);
  }
});


const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Solo se permiten archivos de imagen', 400), false);
  }
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("logo");

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `signature-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

export const uploadSignature = multer({
  storage: signatureStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('signature');
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// POST /api/user/register
export const register = async (req, res) => {
  const { email, password, name, lastName, nif } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw AppError.conflict('El email ya existe');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    lastName,
    nif,
    verificationCode
    });

  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    data: {
      user: {
        email: user.email,
        status: user.status,
        role: user.role
      },
      accessToken,
      refreshToken
    }
  });
};
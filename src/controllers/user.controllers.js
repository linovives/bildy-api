import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { refreshTokenSign, tokenSign } from '../utils/handleJwt.js';
import { compare } from 'bcryptjs';

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

export const validateEmail = async (req, res) => {
  const { code } = req.body;
  const user = req.user; 

  if (user.status === 'verified') {
    throw AppError.badRequest('El email ya ha sido verificado');
  }

  if (user.verificationCode === code) {
    user.status = 'verified';
    user.verificationCode = undefined;
    user.verificationAttempts = 3;
    await user.save();

    return res.status(200).json({ message: 'Email verificado correctamente' });
  }

  user.verificationAttempts -= 1;
  await user.save();

  if (user.verificationAttempts <= 0) {
    throw AppError.tooManyRequests('Has agotado los intentos permitidos');
  }

  throw AppError.badRequest(`Código incorrecto. Intentos restantes: ${user.verificationAttempts}`);
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw AppError.unauthorized('Credenciales incorrectas');
  }

  if (user.status !== 'verified') {
    throw AppError.forbidden('Por favor, verifica tu email antes de loguearte');
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw AppError.unauthorized('Credenciales incorrectas');
  }

  const accessToken = tokenSign(user);
  const refreshToken = refreshTokenSign(user);

  res.status(200).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken,
    refreshToken
  });
};
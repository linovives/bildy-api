import User from '../models/User.js';
import Company from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { refreshTokenSign, tokenSign } from '../utils/handleJwt.js';
import RefreshToken from '../models/RefreshToken.js';
import { hash, compare } from 'bcrypt'
import eventEmitter from '../services/events.js';
import { sendVerificationEmail } from '../services/mail.service.js';

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
  await sendVerificationEmail(email, verificationCode);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    lastName,
    nif,
    verificationCode
    });

  eventEmitter.emit('user:registered', user);

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

    eventEmitter.emit('user:verified', user);

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
  
  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
  });

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

export const updateProfile = async (req, res) => {
  const { name, lastName, nif } = req.body;
  const user = req.user; 

  user.name = name;
  user.lastName = lastName;
  user.nif = nif;

  await user.save();

  res.status(200).json({
    message: "Perfil actualizado correctamente",
    user: {
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      nif: user.nif
    }
  });
};

export const updateCompany = async (req, res) => {
  let { name, cif, address, isFreelance } = req.body;
  const user = req.user; 

  if (isFreelance) {
    cif = user.nif; 
    name = `${user.name} ${user.lastName}`; 
  }

  let company = await Company.findOne({ cif });

  if (!company) {
    company = await Company.create({
      owner: user._id,
      name,
      cif,
      address,
      isFreelance
    });
  } else {
    user.role = 'guest'; 
    await user.save();
  }

  res.status(200).json({
    message: company.owner.equals(user._id) 
      ? "Compañía creada. Eres el administrador." 
      : "Te has unido a una compañía existente. Ahora eres invitado (guest).",
    company
  });
};

export const updateLogo = async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest('No se ha enviado ninguna imagen en el campo "logo"');
  }

  const company = await Company.findOne({ owner: req.user._id });

  if (!company) {
    throw AppError.notFound('No tienes una compañía asociada.');
  }

  company.logo = `/uploads/${req.file.filename}`;
  await company.save();

  res.status(200).json({
    message: "Logo de la compañía actualizado correctamente",
    logo: company.logo,
    companyName: company.name
  });
};

export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw AppError.notFound('Usuario no encontrado');
  }

  const company = await Company.findOne({ owner: user._id });
  
  res.status(200).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      company: company
    }
  });
};

// POST /api/user/refresh
export const refreshSession = async (req, res) => {
  const { refreshToken: tokenRecibido } = req.body;
  if (!tokenRecibido) throw AppError.unauthorized('Token no proporcionado');

  const tokenDoc = await RefreshToken.findOne({ token: tokenRecibido });
  
  if (!tokenDoc || tokenDoc.expiryDate < new Date()) {
    if (tokenDoc) await RefreshToken.deleteOne({ _id: tokenDoc._id });
    throw AppError.unauthorized('Refresh token inválido o expirado');
  }
  const accessToken = tokenSign({ _id: tokenDoc.userId }); 

  res.json({ accessToken });
};

// POST /api/user/logout
export const logoutSession = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw AppError.badRequest('Se requiere el refreshToken para cerrar sesión');
  
  await RefreshToken.deleteOne({ token: refreshToken });

  res.status(200).json({ message: "Sesión cerrada correctamente" });
};


export const deleteUser = async (req, res) => {
  const { soft } = req.query; 
  const userId = req.user._id;

  if (soft === 'true') {
    // Soft delete
    await User.findByIdAndUpdate(userId, { deleted: true });
    eventEmitter.emit('user:deleted', req.user.email);

    res.status(200).json({ 
      message: "Usuario desactivado correctamente (soft delete)" 
    });
  } else {
    // Hard delete
    const userEmail = req.user.email;
    await RefreshToken.deleteMany({ userId });
    await Company.deleteOne({ owner: userId });    
    await User.findByIdAndDelete(userId);

    eventEmitter.emit('user:deleted', req.user.email);

    res.status(200).json({ 
      message: "Usuario y todos sus datos eliminados permanentemente (hard delete)" 
    });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw AppError.notFound('Usuario no encontrado');
  }

  const isMatch = await compare(currentPassword, user.password);
  if (!isMatch) {
    throw AppError.unauthorized('La contraseña actual es incorrecta');
  }

  user.password = await hash(newPassword, 10);
  await user.save();

  res.status(200).json({ 
    message: "Contraseña actualizada con éxito" 
  });
};


export const inviteUser = async (req, res) => {
  const { email, name, lastName } = req.body;
  const adminUser = req.user;

  if (adminUser.role !== 'admin') {
    throw AppError.forbidden('Acceso denegado: Solo los administradores pueden invitar');
  }

  const newUser = new User({
    email,
    name,
    lastName,
    role: 'guest',
    company: adminUser.company, 
    status: 'verified',
    password: await hash('password123', 10)
  });

  await newUser.save({ validateBeforeSave: false });

  eventEmitter.emit('user:invited', newUser);

  res.status(201).json({
    message: "Invitación enviada y usuario creado",
    data: {
      email: newUser.email,
      role: newUser.role,
      company: newUser.company
    }
  });
};
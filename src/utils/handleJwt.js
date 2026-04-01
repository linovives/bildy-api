import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; 
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const tokenSign = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
};

export const refreshTokenSign = (user) => {
  return jwt.sign(
    { _id: user._id }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyAccessToken = (tokenJwt) => {
  try {
    const payload = jwt.verify(tokenJwt, JWT_SECRET);
    return {
      valid: true,
      expired: false,
      payload
    };
  } catch (err) {
    return {
      valid: false,
      expired: err.name === 'TokenExpiredError',
      payload: null
    };
  }
};
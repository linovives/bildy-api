import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max: process.env.NODE_ENV === 'test' ? 10000 : 100,
    
    message: {
        error: true,
        message: "Demasiadas peticiones desde esta IP, inténtalo de nuevo en 15 minutos"
    },

    standardHeaders: true,
    legacyHeaders: false, 
});

export default limiter;
import { verifyAccessToken } from "../utils/handleJwt.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js";

const extractBearerToken = (authorizationHeader) => {
    if (!authorizationHeader) {
        return null;
    }
    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
};

export const validateUser = async (req, res, next) => {
    try {
        const token = extractBearerToken(req.headers.authorization);

        if (!token) {
            throw AppError.unauthorized("Falta el token Bearer");
        }

        const result = verifyAccessToken(token);

        if (!result.valid) {
            throw AppError.unauthorized("El access token es inválido");
        }
        
        if (result.expired) {
            throw AppError.unauthorized("El access token ha expirado");
        }
        const user = await User.findById(result.payload.id || result.payload._id);

        if (!user) {
            throw AppError.unauthorized("El usuario del token no existe");
        }

        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        next(error);
    }
};
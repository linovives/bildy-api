import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .transform(val => val.toLowerCase().trim()), 
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"), 
  name: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  nif: z.string().min(1, "El NIF es obligatorio")
});
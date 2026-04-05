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

export const validateEmailSchema = z.object({
  code: z.string()
    .length(6, "El código debe tener exactamente 6 dígitos")
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido").transform(val => val.toLowerCase().trim()),
  password: z.string().min(1, "La contraseña es obligatoria")
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  nif: z.string().min(1, "El NIF es obligatorio")
});

export const companySchema = z.discriminatedUnion("isFreelance", [
  z.object({
    isFreelance: z.literal(true),
    name: z.string().optional(),
    cif: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      number: z.string().optional(),
      postal: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional()
    }).optional()
  }),
  
  z.object({
    isFreelance: z.literal(false),
    name: z.string().min(1, "El nombre de la empresa es obligatorio para no-freelance"),
    cif: z.string().min(1, "El CIF es obligatorio para no-freelance"),
    address: z.object({
      street: z.string().min(1, "La calle es obligatoria"),
      number: z.string().optional(),
      postal: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional()
    }).optional()
  })
]);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: "La nueva contraseña debe ser diferente a la actual",
  path: ["newPassword"], 
});
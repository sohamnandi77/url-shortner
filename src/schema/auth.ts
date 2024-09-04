import { z } from "zod";

export const EmailSchema = z.string().email({
  message: "Email is required",
});

export const PasswordSchema = z.string().min(6, {
  message: "Password is required",
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

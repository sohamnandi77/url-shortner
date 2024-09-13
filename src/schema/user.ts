import { trim } from "@/lib/trim";
import { z } from "zod";

export const UpdateUserSchema = z.object({
  name: z.preprocess(trim, z.string().min(1).max(64)).optional(),
  email: z.preprocess(trim, z.string().email()).optional(),
  image: z.string().url().optional(),
  defaultWorkspace: z.preprocess(trim, z.string().min(1)).optional(),
});

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
    "Password must contain at least one number, one uppercase, and one lowercase letter",
  );

export const AddPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Confirm password must match password",
    path: ["confirmPassword"],
  });

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Confirm password must match new password",
    path: ["confirmPassword"],
  });

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Confirm password must match password",
    path: ["confirmPassword"],
  });

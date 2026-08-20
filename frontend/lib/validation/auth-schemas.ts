import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

const passwordRule = z
  .string()
  .min(8, "At least 8 characters.")
  .regex(/[a-z]/, "Needs a lowercase letter.")
  .regex(/[A-Z]/, "Needs an uppercase letter.")
  .regex(/\d/, "Needs a digit.")
  .regex(/[@$!%*?&]/, "Needs a special character (@$!%*?&).");

export const registerSchema = z
  .object({
    name: z.string().min(1, "Full name is required."),
    email: z.string().min(1, "Email is required").email("Enter a valid email address."),
    password: passwordRule,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;
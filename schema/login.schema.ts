import { z } from "zod";

export const formSchema = z.object({
    email: z.string().email({
        message: "Please provide a valid email address.",
      }),
      password: z.string().min(8, {
        message: "Password must be at least 8 characters long.",
      }).regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      }).regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      }).regex(/\d/, {
        message: "Password must contain at least one number.",
      }).regex(/[@$!%*?&#]/, {
        message: "Password must contain at least one special character (e.g., @, $, !, %, *, ?, &).",
      }),
      rememberMe: z.boolean().default(false).optional(),
  })
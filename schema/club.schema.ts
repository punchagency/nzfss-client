import { z } from "zod";

export const clubFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Club name must be at least 3 characters long." }),

  email: z
    .string()
    .email({ message: "Please provide a valid email address." }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/\d/, { message: "Password must contain at least one number." })
    .regex(/[@$!%*?&#]/, {
      message: "Password must contain at least one special character (e.g., @, $, !, %, *, ?, &, #).",
    }),

  confirmPassword: z
    .string()
    .min(8, { message: "Password confirmation must be at least 8 characters long." })
})
  .refine((data) => {
    // Cross-field validation: check if password and confirmPassword match
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
      return false; // Validation failed if passwords don't match
    }
    return true; // Validation passes if passwords match
  }, {
    message: "Password confirmation does not match password.", // Custom error message
    path: ["confirmPassword"], // This is where the error should be added
  })


export const updateClubFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Club name must be at least 3 characters long." })
    .optional(),

  email: z
    .string()
    .email({ message: "Please provide a valid email address." })
    .optional(),

  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/\d/, { message: "Password must contain at least one number." })
    .regex(/[@$!%*?&#]/, {
      message: "Password must contain at least one special character (e.g., @, $, !, %, *, ?, &, #).",
    })
    .optional(),

  confirmPassword: z
    .string()
    .optional(),
})
.refine((data) => {
  // If newPassword is provided, confirmPassword must match
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "New password and confirmation must match",
  path: ["confirmPassword"],
});


export type ClubFormValues = z.infer<typeof clubFormSchema>;
export type UpdateClubFormValues = z.infer<typeof updateClubFormSchema>;

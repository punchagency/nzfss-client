import { z } from "zod";

export const yearbookSchema = z.object({
    yearbook: z
    .string()
    .min(10, { message: "yearbook must be at least 10 characters long." }),

    yearPublish: z
    .string()
    .min(2, { message: "Year published must be at least 2 characters long." })
    .max(4, { message: "Year published must be at most 4 characters long." }),
})
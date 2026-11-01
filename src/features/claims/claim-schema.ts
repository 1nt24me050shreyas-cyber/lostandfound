import { z } from "zod";

export const claimSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  uniqueMarks: z
    .string()
    .trim()
    .min(10, "Describe a unique mark or detail.")
    .max(500, "Keep your description under 500 characters."),
  lostDate: z.string().min(1, "Choose when you lost it."),
  lostLocation: z.string().trim().min(3, "Add the place where you lost it.").max(120),
  photoUrl: z.string().optional(),
  consent: z
    .boolean()
    .refine(Boolean, "Please confirm you understand how this information will be used."),
});

export type ClaimFormValues = z.infer<typeof claimSchema>;

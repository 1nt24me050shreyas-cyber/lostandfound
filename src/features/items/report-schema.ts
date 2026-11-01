import { z } from "zod";

const categorySchema = z
  .string()
  .trim()
  .min(1, "Choose the category that fits best.")
  .max(40, "Choose a category under 40 characters.");

export const reportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Add a few words so people can recognize it.")
    .max(80, "Keep the title under 80 characters."),
  category: categorySchema,
  description: z
    .string()
    .trim()
    .min(15, "A little more detail will help the right person recognize it.")
    .max(600, "Keep the description under 600 characters."),
  location: z
    .string()
    .trim()
    .min(3, "Add a nearby place or landmark.")
    .max(100, "Keep the location under 100 characters."),
  date: z
    .string()
    .min(1, "Choose the date.")
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00`)), "Choose a valid date.")
    .refine((value) => value <= localDateString(), "The date cannot be in the future."),
  time: z.string(),
  reporter: z
    .string()
    .trim()
    .min(2, "Add your first name.")
    .max(40, "Keep your name under 40 characters."),
  contactEmail: z.string().trim().email("Enter a valid email address."),
  contactPhone: z.string().trim().max(24, "Keep the phone number under 24 characters."),
});

export type ReportValues = z.input<typeof reportSchema>;
export type ValidatedReportValues = z.output<typeof reportSchema>;

export function localDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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

export function formatReportDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatReportPhone(value: string) {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

import { z } from "zod";

// === DESIGNERS ===
export const insertDesignerSchema = z.object({
  fullName: z.string().min(3, "Name must be at least 3 characters"),
  workingHours: z.coerce.number().min(1).max(12),
});

export type Designer = {
  id: string;
  fullName: string;
  workingHours: number;
  attachedObjectsCount: number;
  createdAt: number;
};
export type InsertDesigner = z.infer<typeof insertDesignerSchema>;

// === OBJECTS ===
export const insertObjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  designerId: z.string().min(1, "Designer is required"),
  color: z.string(),
  size: z.enum(["small", "normal", "large"]),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

export type AppObject = {
  id: string;
  name: string;
  designerId: string;
  color: string;
  position: [number, number, number];
  size: "small" | "normal" | "large";
  createdAt: number;
};
export type InsertObject = z.infer<typeof insertObjectSchema>;

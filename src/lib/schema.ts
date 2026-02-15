import { z } from "zod";

// === DESIGNERS ===
export const insertDesignerSchema = z
  .object({
    fullName: z.string().min(3, "Name must be at least 3 characters"),
    workingHoursFrom: z.coerce.number().min(0, "From 0 to 23").max(23),
    workingHoursTo: z.coerce.number().min(0, "From 0 to 23").max(23),
  })
  .refine((data) => data.workingHoursTo > data.workingHoursFrom, {
    message: "Time «to» must be later than «from»",
    path: ["workingHoursTo"],
  });

export type Designer = {
  id: string;
  fullName: string;
  workingHoursFrom: number;
  workingHoursTo: number;
  attachedObjectsCount: number;
  createdAt: number;
};
export type InsertDesigner = z.infer<typeof insertDesignerSchema>;

// === OBJECTS ===
export const objectShapeEnum = z.enum(["box", "sphere", "cylinder"]);
export const insertObjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  designerId: z.string().min(1, "Designer is required"),
  color: z.string(),
  shape: objectShapeEnum.default("box"),
  size: z.enum(["small", "normal", "large"]),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

export type ObjectShape = z.infer<typeof objectShapeEnum>;
export type AppObject = {
  id: string;
  name: string;
  designerId: string;
  color: string;
  position: [number, number, number];
  shape?: "box" | "sphere" | "cylinder";
  size: "small" | "normal" | "large";
  createdAt: number;
};
export type InsertObject = z.infer<typeof insertObjectSchema>;

import { z } from "zod";
import { ItemType } from "@prisma/client";

export const itemCreateSchema = z.object({
  type: z.nativeEnum(ItemType),
  title: z.string().min(1).max(120),
  content: z.string().min(1),
  tags: z.array(z.string().min(1).max(32)).default([]),
});

export const itemUpdateSchema = itemCreateSchema.partial().extend({
  deletedAt: z.date().nullable().optional(),
});

export const cvCreateSchema = z.object({
  name: z.string().min(1).max(120),
  headerName: z.string().min(1).max(120),
  headerPhone: z.string().min(1).max(60),
  headerEmail: z.string().email(),
  headerLinks: z.string().default(""),
  summary: z.string().max(1200).default(""),
});

export const cvUpdateSchema = cvCreateSchema.partial();

export const cvItemUpdateSchema = z.object({
  itemId: z.string().min(1),
  included: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

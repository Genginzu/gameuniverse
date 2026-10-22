import { z } from "zod";

import { SHOWCASE_LIBRARY_STATUSES } from "@/types/home";

const kindSchema = z.enum(["game", "character"]);
const statusSchema = z.enum(SHOWCASE_LIBRARY_STATUSES);

export const addShowcaseItemSchema = z.object({
  kind: kindSchema,
  entityId: z.uuid(),
  libraryStatus: statusSchema.optional(),
});

export const reorderShowcaseSchema = z.object({
  kind: kindSchema,
  ids: z.array(z.uuid()).min(1).max(20),
});

export const updateShowcaseItemSchema = z.object({
  libraryStatus: statusSchema,
});

export type AddShowcaseItemInput = z.infer<typeof addShowcaseItemSchema>;
export type ReorderShowcaseInput = z.infer<typeof reorderShowcaseSchema>;

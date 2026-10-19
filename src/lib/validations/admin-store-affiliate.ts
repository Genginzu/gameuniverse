import { z } from "zod";
import { AFFILIATE_NETWORKS } from "@/types/affiliate";

const QUERY_TEMPLATE_RE = /^\?[^\s]+$/;

function isValidTemplate(value: string): boolean {
  if (QUERY_TEMPLATE_RE.test(value)) return true;
  if (!value.startsWith("https://") || !value.includes("{url}")) return false;
  try {
    new URL(value.replace(/\{url\}|\{tag\}/g, "x"));
    return true;
  } catch {
    return false;
  }
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

export const adminStoreAffiliateSchema = z
  .object({
    affiliateEnabled: z.boolean(),
    affiliateNetwork: z
      .enum(AFFILIATE_NETWORKS)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    affiliateTag: optionalText(200),
    affiliateUrlTemplate: optionalText(1000).refine(
      (value) => value === null || isValidTemplate(value),
      {
        message: "invalidTemplate",
      }
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.affiliateEnabled) return;
    if (!data.affiliateNetwork) {
      ctx.addIssue({ code: "custom", path: ["affiliateNetwork"], message: "networkRequired" });
    }
    if (data.affiliateNetwork !== "amazon" && !data.affiliateUrlTemplate) {
      ctx.addIssue({ code: "custom", path: ["affiliateUrlTemplate"], message: "templateRequired" });
    }
  });

export type AdminStoreAffiliateInput = z.input<typeof adminStoreAffiliateSchema>;
export type AdminStoreAffiliateData = z.output<typeof adminStoreAffiliateSchema>;

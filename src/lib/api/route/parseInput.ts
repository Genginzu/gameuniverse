import type { NextRequest } from "next/server";
import type { z } from "zod";
import { validationError } from "./routeErrors";

function validate<S extends z.ZodType>(schema: S, input: unknown, message: string): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw validationError(result.error.issues, message);
  return result.data;
}

/** An empty body reads as `{}` so all-optional schemas accept body-less requests. */
async function readJson(request: NextRequest): Promise<unknown> {
  const text = await request.text();
  if (text.trim() === "") return {};
  try {
    return JSON.parse(text);
  } catch {
    throw validationError({ reason: "invalid_json" }, "Invalid JSON body");
  }
}

export async function parseBody<S extends z.ZodType>(request: NextRequest, schema: S) {
  return validate(schema, await readJson(request), "Invalid request body");
}

/** A repeated key keeps its first value, like `searchParams.get`. */
export function parseQuery<S extends z.ZodType>(request: NextRequest, schema: S) {
  const raw: Record<string, string> = {};
  for (const [key, value] of new URL(request.url).searchParams) {
    if (!(key in raw)) raw[key] = value;
  }
  return validate(schema, raw, "Invalid query parameters");
}

export function parseParams<S extends z.ZodType>(raw: unknown, schema: S) {
  return validate(schema, raw, "Invalid route parameters");
}

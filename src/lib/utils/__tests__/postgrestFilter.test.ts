import { describe, it, expect } from "vitest";
import { ilikeAnyFilter, quoteFilterValue } from "@/lib/utils/postgrestFilter";

describe("quoteFilterValue", () => {
  it("wraps the value in double quotes and escapes quotes and backslashes", () => {
    expect(quoteFilterValue('a"b\\c')).toBe('"a\\"b\\\\c"');
  });
});

describe("ilikeAnyFilter", () => {
  it("builds one quoted ilike clause per column", () => {
    expect(ilikeAnyFilter(["code", "name"], " fr ")).toBe('code.ilike."%fr%",name.ilike."%fr%"');
  });

  it("keeps PostgREST reserved characters inside the quoted value", () => {
    const filter = ilikeAnyFilter(["code"], "zzz,code.like.*),and(x");

    expect(filter).toBe('code.ilike."%zzz,code.like.*),and(x%"');
    expect(filter.split('"')).toHaveLength(3);
  });
});

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Feature: image-crop-upload, Property 7: Synchronisation des clés de traduction FR/EN
 *
 * _For every_ key in the `upload.crop` namespace of `fr.json`, that same key
 * must exist in `en.json`, and vice-versa. The two files must have exactly the
 * same set of keys for this namespace.
 *
 * **Validates: Requirements 9.2**
 */

describe("i18n sync — Property 7: upload.crop keys", () => {
  const frMessages = JSON.parse(fs.readFileSync(path.resolve("src/messages/fr.json"), "utf-8"));
  const enMessages = JSON.parse(fs.readFileSync(path.resolve("src/messages/en.json"), "utf-8"));

  const frCropKeys = Object.keys(frMessages.upload?.crop ?? {}).sort();
  const enCropKeys = Object.keys(enMessages.upload?.crop ?? {}).sort();

  it("upload.crop namespace exists in both files", () => {
    expect(frMessages.upload?.crop).toBeDefined();
    expect(enMessages.upload?.crop).toBeDefined();
  });

  it("fr.json and en.json have the same upload.crop keys", () => {
    expect(frCropKeys).toEqual(enCropKeys);
  });

  it("all expected keys are present", () => {
    const expectedKeys = ["cancel", "confirm", "errorCanvasFailed", "title", "zoom"];
    expect(frCropKeys).toEqual(expectedKeys);
    expect(enCropKeys).toEqual(expectedKeys);
  });
});

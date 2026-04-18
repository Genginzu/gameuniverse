import { describe, it, expect } from "vitest";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";

describe("i18n key synchronization — notifications & postComments", () => {
  it("notifications namespace has the same keys in FR and EN", () => {
    const frKeys = Object.keys((fr as Record<string, Record<string, string>>).notifications).sort();
    const enKeys = Object.keys((en as Record<string, Record<string, string>>).notifications).sort();
    expect(frKeys).toEqual(enKeys);
  });

  it("postComments namespace has the same keys in FR and EN", () => {
    const frKeys = Object.keys((fr as Record<string, Record<string, string>>).postComments).sort();
    const enKeys = Object.keys((en as Record<string, Record<string, string>>).postComments).sort();
    expect(frKeys).toEqual(enKeys);
  });

  it("notifications namespace has all required keys", () => {
    const requiredKeys = [
      "ariaLabel",
      "noNotifications",
      "markAllAsRead",
      "typePostComment",
      "typeDiscussionMessage",
      "dismiss",
    ];
    const frKeys = Object.keys((fr as Record<string, Record<string, string>>).notifications);
    const enKeys = Object.keys((en as Record<string, Record<string, string>>).notifications);
    for (const key of requiredKeys) {
      expect(frKeys).toContain(key);
      expect(enKeys).toContain(key);
    }
  });

  it("postComments namespace has all required keys", () => {
    const requiredKeys = [
      "title",
      "noComments",
      "placeholder",
      "submit",
      "deleteLabel",
      "charCount",
    ];
    const frKeys = Object.keys((fr as Record<string, Record<string, string>>).postComments);
    const enKeys = Object.keys((en as Record<string, Record<string, string>>).postComments);
    for (const key of requiredKeys) {
      expect(frKeys).toContain(key);
      expect(enKeys).toContain(key);
    }
  });
});

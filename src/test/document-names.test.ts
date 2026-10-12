import { beforeEach, describe, expect, it } from "vitest";
import { documentNameSchema, loadSessionNames, rememberSession, renameSavedSession } from "@/lib/legal/local";

describe("saved document names", () => {
  const id = "a8638b65-3eb8-4a7c-bebf-1c815a8ac247";
  beforeEach(() => localStorage.clear());
  it("renames a saved document and reads back the name", () => {
    rememberSession(id);
    renameSavedSession(id, "  Freelancer agreement — Acme  ");
    expect(loadSessionNames()[id]).toBe("Freelancer agreement — Acme");
  });
  it("rejects empty names", () => {
    expect(documentNameSchema.safeParse("   ").success).toBe(false);
  });
  it("does not rename an unsaved document", () => {
    expect(() => renameSavedSession(id, "Contract")).toThrow();
    expect(loadSessionNames()).toEqual({});
  });
});
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSnapshot } from "../src/snapshot.js";

describe("loadSnapshot", () => {
  it("reads a package directory without running its lifecycle scripts", async () => {
    const fixture = path.resolve("test/fixtures/new-package");
    const snapshot = await loadSnapshot(fixture);

    expect(snapshot.name).toBe("demo-widget");
    expect(snapshot.version).toBe("1.1.0");
    expect(snapshot.scripts.postinstall).toContain("fetch");
    expect(snapshot.files.map((file) => file.path)).toContain("install.js");
  });
});

import { describe, expect, it } from "vitest";
import { diffSnapshots } from "../src/diff.js";
import type { PackageSnapshot } from "../src/types.js";

function snapshot(overrides: Partial<PackageSnapshot> = {}): PackageSnapshot {
  return {
    source: "fixture",
    name: "demo-package",
    version: "1.0.0",
    scripts: {},
    dependencies: {},
    optionalDependencies: {},
    peerDependencies: {},
    files: [],
    implicitNativeBuild: false,
    ...overrides,
  };
}

describe("diffSnapshots", () => {
  it("raises high attention for a new network-capable install hook", () => {
    const result = diffSnapshots(
      snapshot({ version: "1.0.0" }),
      snapshot({
        version: "1.1.0",
        scripts: { postinstall: "node install.js && fetch('https://example.test')" },
      }),
    );

    expect(result.level).toBe("high-attention");
    expect(result.installScripts).toEqual([
      expect.objectContaining({ hook: "postinstall", kind: "added" }),
    ]);
    expect(result.capabilitySignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hook: "postinstall", signal: "network" }),
      ]),
    );
  });

  it("is clean when the trust surface is unchanged", () => {
    const before = snapshot({
      scripts: { test: "node test.js" },
      files: [{ path: "package.json", bytes: 42, sha256: "same" }],
    });

    const result = diffSnapshots(before, { ...before, source: "other" });

    expect(result.level).toBe("clean");
    expect(result.installScripts).toHaveLength(0);
    expect(result.files.added).toEqual([]);
    expect(result.files.removed).toEqual([]);
    expect(result.files.changed).toEqual([]);
  });

  it("reports dependency and file changes without overcalling them an install hook", () => {
    const result = diffSnapshots(
      snapshot({
        dependencies: { safe: "1.0.0" },
        files: [{ path: "index.js", bytes: 10, sha256: "old" }],
      }),
      snapshot({
        version: "1.0.1",
        dependencies: { safe: "^1.0.0", added: "2.0.0" },
        files: [
          { path: "index.js", bytes: 11, sha256: "new" },
          { path: "README.md", bytes: 20, sha256: "readme" },
        ],
      }),
    );

    expect(result.level).toBe("notice");
    expect(result.installScripts).toHaveLength(0);
    expect(result.dependencies.added).toEqual([
      expect.objectContaining({ name: "added" }),
    ]);
    expect(result.dependencies.changed).toEqual([
      expect.objectContaining({ name: "safe" }),
    ]);
    expect(result.files.added).toEqual(["README.md"]);
    expect(result.files.changed).toEqual(["index.js"]);
  });
});

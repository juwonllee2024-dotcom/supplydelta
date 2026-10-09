import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as tar from "tar";
import type { FileFingerprint, PackageSnapshot } from "./types.js";

const MAX_ARCHIVE_FILES = 10_000;
const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;

interface PackageManifest {
  name?: unknown;
  version?: unknown;
  license?: unknown;
  scripts?: unknown;
  dependencies?: unknown;
  optionalDependencies?: unknown;
  peerDependencies?: unknown;
}

function recordOf(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function safeRelativePath(value: string): string {
  const normalized = value.replaceAll("\\", "/");
  if (
    normalized.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.split("/").some((part) => part === "..")
  ) {
    throw new Error(`Unsafe archive path rejected: ${value}`);
  }
  return normalized;
}

async function hashFile(filePath: string): Promise<FileFingerprint> {
  const bytes = await readFile(filePath);
  return {
    path: filePath,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

async function collectFiles(root: string, current = root): Promise<FileFingerprint[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const results: FileFingerprint[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(root, absolute)));
    } else if (entry.isFile()) {
      const fingerprint = await hashFile(absolute);
      fingerprint.path = path.relative(root, absolute).split(path.sep).join("/");
      results.push(fingerprint);
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

async function snapshotDirectory(directory: string, source: string): Promise<PackageSnapshot> {
  const manifestPath = path.join(directory, "package.json");
  let manifest: PackageManifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PackageManifest;
  } catch (error) {
    throw new Error(`Could not read ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
    throw new Error(`${manifestPath} must contain string name and version fields`);
  }
  const license =
    typeof manifest.license === "string"
      ? manifest.license
      : manifest.license && typeof manifest.license === "object" && "type" in manifest.license
        ? String((manifest.license as { type: unknown }).type)
        : undefined;
  const files = await collectFiles(directory);
  return {
    source,
    name: manifest.name,
    version: manifest.version,
    license,
    scripts: recordOf(manifest.scripts),
    dependencies: recordOf(manifest.dependencies),
    optionalDependencies: recordOf(manifest.optionalDependencies),
    peerDependencies: recordOf(manifest.peerDependencies),
    files,
    implicitNativeBuild:
      files.some((file) => file.path === "binding.gyp") &&
      !["install", "preinstall"].some((hook) => typeof recordOf(manifest.scripts)[hook] === "string"),
  };
}

function validateArchiveEntry(entryPath: string, type: string, state: { files: number; bytes: number }): void {
  safeRelativePath(entryPath);
  if (type !== "File" && type !== "Directory") {
    throw new Error(`Archive entry type ${type} is not allowed: ${entryPath}`);
  }
  if (type === "File") {
    state.files += 1;
    state.bytes += 0;
    if (state.files > MAX_ARCHIVE_FILES) throw new Error("Archive contains too many files");
  }
}

async function snapshotTarball(archive: string, source: string): Promise<PackageSnapshot> {
  const state = { files: 0, bytes: 0 };
  await tar.t({
    file: archive,
    strict: true,
    onentry: (entry) => {
      const entryType = "type" in entry ? entry.type : "File";
      validateArchiveEntry(entry.path, entryType, state);
      if (entryType === "File") {
        state.bytes += "size" in entry ? entry.size : 0;
        if (state.bytes > MAX_ARCHIVE_BYTES) throw new Error("Archive is larger than 50 MiB");
      }
    },
  });
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "supplydelta-"));
  try {
    await tar.x({
      file: archive,
      cwd: tempRoot,
      strip: 1,
      strict: true,
      preservePaths: false,
      filter: (entryPath, entry) => {
        const entryType = "type" in entry ? entry.type : "File";
        validateArchiveEntry(entryPath, entryType, { files: 0, bytes: 0 });
        const target = path.resolve(tempRoot, entryPath);
        return target === tempRoot || target.startsWith(`${tempRoot}${path.sep}`);
      },
    });
    return await snapshotDirectory(tempRoot, source);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

export async function loadSnapshot(input: string): Promise<PackageSnapshot> {
  const resolved = path.resolve(input);
  const information = await stat(resolved).catch(() => undefined);
  if (!information) throw new Error(`Input does not exist: ${input}`);
  if (information.isDirectory()) return snapshotDirectory(resolved, input);
  if (information.isFile() && resolved.toLowerCase().endsWith(".tgz")) {
    return snapshotTarball(resolved, input);
  }
  throw new Error(`Input must be a package directory or .tgz archive: ${input}`);
}

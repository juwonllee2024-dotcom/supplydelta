#!/usr/bin/env node
import { diffSnapshots } from "./diff.js";
import { renderHuman, renderJson } from "./render.js";
import { loadSnapshot } from "./snapshot.js";
import { pathToFileURL } from "node:url";

function printHelp(): void {
  console.log(`SupplyDelta — diff npm package trust surfaces before approval

Usage:
  supplydelta diff [options] <before-directory-or-tgz> <after-directory-or-tgz>

Options:
  --json                      Emit schema-versioned JSON
  --fail-on install-script    Exit 1 when a lifecycle hook is added, removed, or changed
  --fail-on any-change        Exit 1 for any observed package-surface change
  -h, --help                  Show this help

SupplyDelta is read-only: it never installs a package or executes lifecycle scripts.
`);
}

interface ParsedOptions {
  json: boolean;
  failOn?: "install-script" | "any-change";
  before?: string;
  after?: string;
}

function parseArgs(args: string[]): ParsedOptions {
  const options: ParsedOptions = { json: false };
  const positional: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--fail-on") {
      const value = args[++index];
      if (value !== "install-script" && value !== "any-change") {
        throw new Error("--fail-on expects install-script or any-change");
      }
      options.failOn = value;
    } else if (argument === "-h" || argument === "--help") {
      printHelp();
      process.exit(0);
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else positional.push(argument);
  }
  if (positional.length !== 2) throw new Error("diff requires exactly two package directories or .tgz archives");
  [options.before, options.after] = positional;
  return options;
}

export async function runCli(args: string[]): Promise<number> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    return 0;
  }
  const [command, ...rest] = args;
  if (command !== "diff") throw new Error(`Unknown command: ${command}`);
  const options = parseArgs(rest);
  const before = await loadSnapshot(options.before ?? "");
  const after = await loadSnapshot(options.after ?? "");
  const delta = diffSnapshots(before, after);
  process.stdout.write(options.json ? renderJson(delta) : renderHuman(delta));
  if (options.failOn === "install-script" && (delta.installScripts.length > 0 || delta.implicitNativeBuildChanged)) return 1;
  if (options.failOn === "any-change" && delta.level !== "clean") return 1;
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      console.error(`supplydelta: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 2;
    },
  );
}

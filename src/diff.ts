import {
  LIFECYCLE_HOOKS,
  type CapabilityFinding,
  type ChangeKind,
  type DependencyChange,
  type PackageDelta,
  type PackageSnapshot,
  type ScriptChange,
} from "./types.js";

const CAPABILITY_PATTERNS: ReadonlyArray<{
  signal: CapabilityFinding["signal"];
  pattern: RegExp;
}> = [
  { signal: "network", pattern: /https?:\/\/|\bfetch\s*\(|\b(?:axios|node-fetch|curl|wget)\b/i },
  { signal: "environment", pattern: /\bprocess\.env\b|\benvironment\b/i },
  {
    signal: "shell",
    pattern: /\b(?:child_process|exec(?:File|Sync)?|spawn(?:Sync)?|powershell|cmd\.exe|bash\s+-c|sh\s+-c)\b/i,
  },
  {
    signal: "credential-path",
    pattern: /(?:\.ssh|\.npmrc|\.aws|id_rsa|password|secret|token|credential)/i,
  },
  { signal: "obfuscation", pattern: /\b(?:eval|fromCharCode|atob|base64|Buffer\.from)\b/i },
];

const MAX_SCRIPT_DISPLAY_LENGTH = 1_000;

function sortedKeys(record: Record<string, string>): string[] {
  return Object.keys(record).sort((a, b) => a.localeCompare(b));
}

function scriptValue(value: string | undefined): {
  value: string | undefined;
  truncated: boolean;
} {
  if (value === undefined || value.length <= MAX_SCRIPT_DISPLAY_LENGTH) {
    return { value, truncated: false };
  }

  return {
    value: `${value.slice(0, MAX_SCRIPT_DISPLAY_LENGTH)}…`,
    truncated: true,
  };
}

function compareScripts(
  before: Record<string, string>,
  after: Record<string, string>,
): ScriptChange[] {
  return LIFECYCLE_HOOKS.flatMap((hook) => {
    const previous = before[hook];
    const next = after[hook];
    if (previous === next) {
      return [];
    }

    const kind: ChangeKind = previous === undefined ? "added" : next === undefined ? "removed" : "changed";
    const previousDisplay = scriptValue(previous);
    const nextDisplay = scriptValue(next);
    return [
      {
        hook,
        kind,
        before: previousDisplay.value,
        after: nextDisplay.value,
        beforeTruncated: previousDisplay.truncated || undefined,
        afterTruncated: nextDisplay.truncated || undefined,
      },
    ];
  });
}

function compareDependencies(
  before: PackageSnapshot,
  after: PackageSnapshot,
): PackageDelta["dependencies"] {
  const added: DependencyChange[] = [];
  const removed: DependencyChange[] = [];
  const changed: DependencyChange[] = [];
  const scopes = [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ] as const;

  for (const scope of scopes) {
    const previous = before[scope];
    const next = after[scope];
    const names = new Set([...sortedKeys(previous), ...sortedKeys(next)]);
    for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
      const previousRange = previous[name];
      const nextRange = next[name];
      if (previousRange === nextRange) {
        continue;
      }
      const change: DependencyChange = {
        name,
        scope,
        kind: previousRange === undefined ? "added" : nextRange === undefined ? "removed" : "changed",
        before: previousRange,
        after: nextRange,
      };
      if (change.kind === "added") added.push(change);
      else if (change.kind === "removed") removed.push(change);
      else changed.push(change);
    }
  }

  return { added, removed, changed };
}

function compareFiles(before: PackageSnapshot, after: PackageSnapshot): PackageDelta["files"] {
  const previous = new Map(before.files.map((file) => [file.path, file]));
  const next = new Map(after.files.map((file) => [file.path, file]));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const paths = [...new Set([...previous.keys(), ...next.keys()])].sort((a, b) => a.localeCompare(b));

  for (const path of paths) {
    const oldFile = previous.get(path);
    const newFile = next.get(path);
    if (!oldFile && newFile) added.push(path);
    else if (oldFile && !newFile) removed.push(path);
    else if (oldFile && newFile && oldFile.sha256 !== newFile.sha256) changed.push(path);
  }

  return { added, removed, changed, beforeCount: before.files.length, afterCount: after.files.length };
}

function findCapabilitySignals(scripts: ScriptChange[], after: PackageSnapshot): CapabilityFinding[] {
  const findings: CapabilityFinding[] = [];
  for (const change of scripts) {
    const value = change.after ?? (change.kind === "removed" ? change.before : undefined);
    if (!value) continue;
    for (const { signal, pattern } of CAPABILITY_PATTERNS) {
      if (pattern.test(value)) findings.push({ hook: change.hook, signal });
    }
  }

  if (after.implicitNativeBuild) {
    findings.push({ hook: "install", signal: "shell" });
  }
  return findings;
}

export function diffSnapshots(before: PackageSnapshot, after: PackageSnapshot): PackageDelta {
  const installScripts = compareScripts(before.scripts, after.scripts);
  const capabilitySignals = findCapabilitySignals(installScripts, after);
  const dependencies = compareDependencies(before, after);
  const files = compareFiles(before, after);
  const implicitNativeBuildChanged = before.implicitNativeBuild !== after.implicitNativeBuild;
  const packageIdentityChanged = before.name !== after.name;
  const hasAnyChange =
    installScripts.length > 0 ||
    capabilitySignals.length > 0 ||
    dependencies.added.length > 0 ||
    dependencies.removed.length > 0 ||
    dependencies.changed.length > 0 ||
    files.added.length > 0 ||
    files.removed.length > 0 ||
    files.changed.length > 0 ||
    implicitNativeBuildChanged ||
    packageIdentityChanged;
  const highAttention =
    packageIdentityChanged ||
    (installScripts.some((change) => change.kind !== "removed") && capabilitySignals.length > 0) ||
    (after.implicitNativeBuild && implicitNativeBuildChanged);

  const notes = [
    "Static comparison only: this is not a malware verdict or vulnerability scan.",
    "No package lifecycle script is executed by SupplyDelta.",
  ];
  if (packageIdentityChanged) notes.push("Package names differ; confirm that this is an intentional comparison.");
  if (implicitNativeBuildChanged) notes.push("binding.gyp presence changed; npm may invoke an implicit native build.");
  if (!hasAnyChange) notes.push("No observed trust-surface change between the supplied artifacts.");

  return {
    schemaVersion: 1,
    before: {
      source: before.source,
      name: before.name,
      version: before.version,
      license: before.license,
    },
    after: {
      source: after.source,
      name: after.name,
      version: after.version,
      license: after.license,
    },
    level: !hasAnyChange ? "clean" : highAttention ? "high-attention" : "notice",
    installScripts,
    capabilitySignals,
    dependencies,
    files,
    implicitNativeBuildChanged,
    notes,
  };
}


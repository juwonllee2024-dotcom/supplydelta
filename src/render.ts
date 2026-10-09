import type { DependencyChange, PackageDelta, ScriptChange } from "./types.js";

const MAX_LINES_PER_GROUP = 8;

function trimLabel(value: string, max = 88): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function listOrNone(items: string[], prefix: string): string[] {
  if (items.length === 0) return [`  ${prefix}none`];
  const visible = items.slice(0, MAX_LINES_PER_GROUP).map((item) => `  ${prefix}${item}`);
  if (items.length > MAX_LINES_PER_GROUP) visible.push(`  ${prefix}… ${items.length - MAX_LINES_PER_GROUP} more`);
  return visible;
}

function renderScript(change: ScriptChange): string[] {
  const marker = change.kind === "added" ? "+" : change.kind === "removed" ? "-" : "~";
  const value = change.after ?? change.before ?? "";
  const lines = [`  ${marker} ${change.hook}: ${trimLabel(value)}`];
  if (change.kind === "changed" && change.before) lines.push(`    before: ${trimLabel(change.before)}`);
  return lines;
}

function renderDependencies(changes: DependencyChange[]): string[] {
  return changes.map((change) => {
    const marker = change.kind === "added" ? "+" : change.kind === "removed" ? "-" : "~";
    const range = change.after ?? change.before ?? "";
    return `  ${marker} ${change.name} [${change.scope}]: ${range}`;
  });
}

export function renderHuman(delta: PackageDelta): string {
  const lines = [
    "SupplyDelta — package trust-surface diff",
    `${delta.before.name}@${delta.before.version}  →  ${delta.after.name}@${delta.after.version}`,
    "",
    `REVIEW LEVEL: ${delta.level.toUpperCase()}`,
    "",
    "INSTALL SCRIPTS",
  ];
  if (delta.installScripts.length === 0) lines.push("  none");
  else for (const change of delta.installScripts) lines.push(...renderScript(change));
  lines.push("", "CAPABILITY SIGNALS");
  if (delta.capabilitySignals.length === 0) lines.push("  none detected in changed hooks");
  else {
    for (const finding of delta.capabilitySignals) lines.push(`  ! ${finding.hook}: ${finding.signal}`);
  }
  lines.push("", "DEPENDENCIES");
  const dependencyLines = renderDependencies([
    ...delta.dependencies.added,
    ...delta.dependencies.removed,
    ...delta.dependencies.changed,
  ]);
  lines.push(...listOrNone(dependencyLines, ""));
  lines.push(
    "",
    "FILES",
    ...listOrNone(delta.files.added, "+ "),
    ...listOrNone(delta.files.removed, "- "),
    ...listOrNone(delta.files.changed, "~ "),
    `  totals: ${delta.files.beforeCount} → ${delta.files.afterCount}`,
  );
  if (delta.implicitNativeBuildChanged) lines.push("  ! binding.gyp presence changed (implicit native build)");
  lines.push("", "NOTES", ...delta.notes.map((note) => `  • ${note}`));
  return `${lines.join("\n")}\n`;
}

export function renderJson(delta: PackageDelta): string {
  return `${JSON.stringify(delta, null, 2)}\n`;
}


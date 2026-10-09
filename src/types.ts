export const LIFECYCLE_HOOKS = [
  "preinstall",
  "install",
  "postinstall",
  "prepare",
] as const;

export type LifecycleHook = (typeof LIFECYCLE_HOOKS)[number];
export type ChangeKind = "added" | "removed" | "changed";
export type ReviewLevel = "clean" | "notice" | "high-attention";
export type CapabilitySignal =
  | "network"
  | "environment"
  | "shell"
  | "credential-path"
  | "obfuscation";

export interface FileFingerprint {
  path: string;
  bytes: number;
  sha256: string;
}

export interface PackageSnapshot {
  source: string;
  name: string;
  version: string;
  license?: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  files: FileFingerprint[];
  implicitNativeBuild: boolean;
}

export interface ScriptChange {
  hook: LifecycleHook;
  kind: ChangeKind;
  before?: string;
  after?: string;
  beforeTruncated?: boolean;
  afterTruncated?: boolean;
}

export interface CapabilityFinding {
  hook: LifecycleHook;
  signal: CapabilitySignal;
}

export interface DependencyChange {
  name: string;
  scope: "dependencies" | "optionalDependencies" | "peerDependencies";
  kind: ChangeKind;
  before?: string;
  after?: string;
}

export interface FileDelta {
  added: string[];
  removed: string[];
  changed: string[];
}

export interface PackageDelta {
  schemaVersion: 1;
  before: Pick<PackageSnapshot, "source" | "name" | "version" | "license">;
  after: Pick<PackageSnapshot, "source" | "name" | "version" | "license">;
  level: ReviewLevel;
  installScripts: ScriptChange[];
  capabilitySignals: CapabilityFinding[];
  dependencies: {
    added: DependencyChange[];
    removed: DependencyChange[];
    changed: DependencyChange[];
  };
  files: FileDelta & { beforeCount: number; afterCount: number };
  implicitNativeBuildChanged: boolean;
  notes: string[];
}


#!/usr/bin/env sh
set -eu

# Create the artifacts with scripts disabled before this gate.
npx --yes supplydelta diff --fail-on install-script before.tgz after.tgz


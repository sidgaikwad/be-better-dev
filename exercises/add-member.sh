#!/usr/bin/env bash
# Add a crate to `members` in exercises/Cargo.toml, idempotently.
#
#   ./add-member.sh <crate-dir>
#
# Exists because the members list is reformatted by tooling, so a one-line sed
# against its previous shape silently does nothing and leaves the crate
# orphaned from `cargo test`.
set -euo pipefail
cd "$(dirname "$0")"

crate=${1:?usage: ./add-member.sh <crate-dir>}
[ -d "$crate" ] || { echo "no such crate: $crate"; exit 1; }

if grep -q "^  \"$crate\",$" Cargo.toml; then
  echo "already a member: $crate"
  exit 0
fi

# Insert before the line closing the members array.
tmp=$(mktemp)
awk -v crate="$crate" '
  !done && /^\]$/ { print "  \"" crate "\","; done = 1 }
  { print }
' Cargo.toml > "$tmp"
mv "$tmp" Cargo.toml
echo "added member: $crate"

#!/usr/bin/env bash
# Prove every exercise crate is solvable and every test suite is honest.
#
#   ./verify.sh          all crates
#   ./verify.sh <crate>  one crate
#
# For each crate this checks two things that must both hold:
#   1. the shipped stubs FAIL the suite (a green stub means a test asserts nothing)
#   2. the reference solution PASSES it (a red solution means the suite is wrong)
#
# The swap happens in a temp copy, so your working tree is never touched.
set -euo pipefail

cd "$(dirname "$0")"
crates=("${@:-}")
if [ -z "${crates[0]}" ]; then
  mapfile -t crates < <(find . -maxdepth 2 -name Cargo.toml -not -path ./Cargo.toml -exec dirname {} \; | sed 's|^\./||' | sort)
fi

fail=0
for crate in "${crates[@]}"; do
  [ -d "$crate" ] || { echo "no such crate: $crate"; exit 1; }

  if cargo test -q -p "$crate" >/dev/null 2>&1; then
    echo "FAIL $crate: stubs pass the suite, so the tests assert nothing"
    fail=1
    continue
  fi

  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  cp -R "$crate" "$tmp/crate"
  cp "$crate/solutions/lib.rs" "$tmp/crate/src/lib.rs"
  # Stand the copy up as its own workspace so it builds outside this one.
  printf '\n[workspace]\n' >> "$tmp/crate/Cargo.toml"

  if (cd "$tmp/crate" && cargo test -q >/dev/null 2>&1); then
    echo "ok   $crate: stubs fail, solution passes"
  else
    echo "FAIL $crate: the reference solution does not pass its own suite"
    (cd "$tmp/crate" && cargo test -q 2>&1 | tail -20)
    fail=1
  fi
  rm -rf "$tmp"
  trap - EXIT
done

exit $fail

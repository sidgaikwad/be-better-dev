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
# Both halves run against a temp copy standing in its own workspace, never
# against this one. That keeps the result independent of whether the crate has
# been added to `members` yet: judging the stub half with `cargo test -p` here
# would report "cannot find package" as if it were a healthy red suite, which
# passes a crate nobody has wired up.
set -euo pipefail

cd "$(dirname "$0")"
# Default to every crate on disk. Built with a plain loop rather than mapfile,
# which macOS's bash 3.2 does not have.
crates=("$@")
if [ ${#crates[@]} -eq 0 ]; then
  while IFS= read -r dir; do
    crates+=("$dir")
  done < <(find . -maxdepth 2 -name Cargo.toml -not -path ./Cargo.toml -exec dirname {} \; | sed 's|^\./||' | sort)
fi

# Copy $1 into a fresh temp workspace, optionally swapping in the solution,
# and print the directory to run cargo in.
stage() {
  local crate=$1 use_solution=$2 tmp
  tmp=$(mktemp -d)
  cp -R "$crate" "$tmp/$crate"
  [ "$use_solution" = solution ] && cp "$crate/solutions/lib.rs" "$tmp/$crate/src/lib.rs"
  # Rebuild a workspace root around the copy so `edition.workspace = true` and
  # friends still resolve, under exactly the settings the real crate gets.
  {
    printf '[workspace]\nresolver = "3"\nmembers = ["%s"]\n\n' "$crate"
    sed -n '/^\[workspace.package\]/,$p' Cargo.toml
  } > "$tmp/Cargo.toml"
  echo "$tmp"
}

fail=0
for crate in "${crates[@]}"; do
  [ -d "$crate" ] || { echo "no such crate: $crate"; exit 1; }
  for required in Cargo.toml src/lib.rs solutions/lib.rs; do
    [ -f "$crate/$required" ] || { echo "FAIL $crate: missing $required"; fail=1; continue 2; }
  done

  stub_dir=$(stage "$crate" stubs)
  if (cd "$stub_dir/$crate" && cargo test -q >/dev/null 2>&1); then
    echo "FAIL $crate: stubs pass the suite, so the tests assert nothing"
    rm -rf "$stub_dir"
    fail=1
    continue
  fi
  rm -rf "$stub_dir"

  sol_dir=$(stage "$crate" solution)
  if (cd "$sol_dir/$crate" && cargo test -q >/dev/null 2>&1); then
    echo "ok   $crate: stubs fail, solution passes"
  else
    echo "FAIL $crate: the reference solution does not pass its own suite"
    (cd "$sol_dir/$crate" && cargo test -q 2>&1 | tail -20)
    fail=1
  fi
  rm -rf "$sol_dir"

  # A verified crate that is not a member never runs in the learner's `cargo
  # test`, so say so rather than leaving it silently orphaned.
  grep -q "\"$crate\"" Cargo.toml || echo "     note: $crate is not in members in exercises/Cargo.toml"
done

exit $fail

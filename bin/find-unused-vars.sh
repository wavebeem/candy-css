#!/usr/bin/env bash
set -eu

css="src/candy.css"

:find_vars() {
  grep -o -e '--candy[-a-z0-9]*' "$css" | sort -u
}

:find_defs() {
  grep -o -e '--candy[-a-z0-9]*:' "$css" | tr -d : | sort -u
}

diff <(:find_vars) <(:find_defs)

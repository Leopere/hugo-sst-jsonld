#!/bin/sh
# Copyright © 2026 ColinKnapp.com. All rights reserved.
set -eu
exec "${SHIP_IT_BIN:-$HOME/.local/bin/ship-it}" "$@"

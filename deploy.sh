#!/usr/bin/env bash
# Builds the site and puts it live. Run on the server: bash deploy.sh
set -euo pipefail

WEB_ROOT=/var/www/lovinoes

cd "$(dirname "$0")"

git pull --ff-only
npm ci
npm run build

# New files first, old ones removed after, so the site never goes down mid-deploy.
# favicons/ isn't part of this repo, so it's left alone.
rsync -a --delete-after --exclude favicons/ dist/ "$WEB_ROOT/"

echo "Deployed to $WEB_ROOT"

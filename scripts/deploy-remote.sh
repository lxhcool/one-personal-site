#!/usr/bin/env bash
set -euo pipefail

release_id=${1:?release id is required}
base=${2:-/www/wwwroot/lxhcool-app}
site_url=${3:-https://lxhcoool.cn}
old=$(readlink -f "$base/current")
new="$base/releases/$release_id"
frontend_archive="/tmp/lxhcool-frontend-$release_id.tar.gz"
admin_archive="/tmp/lxhcool-admin-$release_id.tar.gz"
backend_archive="/tmp/lxhcool-backend-$release_id.tar.gz"

cleanup() {
  rm -f "$frontend_archive" "$admin_archive" "$backend_archive" /tmp/deploy-remote.sh
}
trap cleanup EXIT

start_apps() {
  set -a
  . "$base/shared/backend.env"
  set +a

  pm2 delete lxhcool-api >/dev/null 2>&1 || true
  pm2 start "$base/current/lxhcool-backend/dist/main.js" --name lxhcool-api --cwd "$base/current/lxhcool-backend" >/dev/null

  export NODE_ENV=production
  export HOST=127.0.0.1
  export PORT=3000
  export NUXT_API_BASE_URL=http://127.0.0.1:4000
  export NUXT_PUBLIC_SITE_URL="$site_url"
  export NUXT_PUBLIC_API_BASE_URL="$site_url/api"
  export NUXT_PUBLIC_ADMIN_URL="$site_url/manage/"

  pm2 delete lxhcool-web >/dev/null 2>&1 || true
  pm2 start "$base/current/lxhcool-frontend/.output/server/index.mjs" --name lxhcool-web --cwd "$base/current/lxhcool-frontend" >/dev/null
}

wait_for_url() {
  local url=$1
  for _ in $(seq 1 20); do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

echo "Preparing $new from $old"
cp -a "$old" "$new"

rm -rf \
  "$new/lxhcool-frontend/.output" \
  "$new/lxhcool-admin/dist" \
  "$new/lxhcool-backend/dist" \
  "$new/lxhcool-backend/prisma"

tar -xzf "$frontend_archive" -C "$new/lxhcool-frontend"
tar -xzf "$admin_archive" -C "$new/lxhcool-admin"
tar -xzf "$backend_archive" -C "$new/lxhcool-backend"

cd "$new/lxhcool-backend"
npm ci --include=dev --no-audit --no-fund
npm run prisma:generate
npx prisma migrate deploy
npm prune --omit=dev --no-audit --no-fund
node -e 'require("sharp"); console.log("sharp ready")'

ln -sfn "$new" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"

if ! start_apps \
  || ! wait_for_url 'http://127.0.0.1:4000/public/widgets' \
  || ! wait_for_url 'http://127.0.0.1:3000/'; then
  echo 'Health check failed; rolling back.' >&2
  ln -sfn "$old" "$base/current.next"
  mv -Tf "$base/current.next" "$base/current"
  start_apps
  exit 1
fi

pm2 save >/dev/null
echo "Deployment active: $new"
pm2 status

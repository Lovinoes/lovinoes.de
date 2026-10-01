# lovinoes.de

My personal site. React + Vite + Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com).

- `/` home: intro, Discord presence (via [Lanyard](https://github.com/Phineas/lanyard)), GitHub stats, featured projects
- `/projects` all projects with live GitHub stats
- `/status` live metrics from my [statusserver](https://github.com/Lovinoes/statusserver) agents over websockets. Hardware names come from `src/config.ts`; leave `cpuModel`/`cpuCores` out to use what the agent reports. OS, load average and link usage show up automatically when the agent sends them (current statusserver builds do; `max_mbps` needs `network_max_mbps` set)
- Old `/#status` and `/#home` links redirect to the new paths

Content (bio, links, projects, status nodes) lives in [`src/config.ts`](src/config.ts).

## Develop

```bash
npm install
npm run dev
```

The dev server proxies `/status/nodes/*` to lovinoes.de with the production `Origin`, so the status page shows live data locally too.

Add shadcn components with `npx shadcn@latest add <component>`.

## Build & deploy

```bash
npm run build
```

Serve the contents of `dist/` with nginx.

`npm run build` empties `dist/` every time, so don't put anything in there by hand:

- **Favicons** (`/favicons/...`, used by this site *and* the [error pages](https://github.com/Lovinoes/errors)) aren't in this repo yet. Put them in `public/favicons/` and Vite copies them into every build.
- **Error pages** stay in their own checkout of [Lovinoes/errors](https://github.com/Lovinoes/errors) and get served from there (see `location = /error.html` below).

The app uses real paths (`/status`, `/projects`), so nginx needs to hand those to `index.html`.

First, in the `http { }` block (e.g. a new file in `/etc/nginx/conf.d/`). HTML must never be cached: every build deletes the previous hashed JS/CSS, so a browser holding an old `index.html` would load a blank page.

```nginx
map $sent_http_content_type $lovinoes_expires {
    default     off;
    ~^text/html epoch;   # sends Cache-Control: no-cache
}
```

Then inside your existing `server { }` block (keep your SSL, security headers and the `/status/nodes/` websocket proxy as they are):

```nginx
root /path/to/lovinoes.de/dist;
index index.html;

expires $lovinoes_expires;

# Compression: the JS is ~390 KB raw but ~130 KB gzipped. text/html is always included;
# woff2 and images are already compressed, so they're left out.
gzip            on;
gzip_vary       on;
gzip_comp_level 6;
gzip_types      text/css application/javascript application/json image/svg+xml application/manifest+json;

# Error pages from github.com/Lovinoes/errors, served from their own checkout.
error_page 400 401 403 404 405 406 407 408 412 413 414 415 429 431 500 501 502 503 504 /error.html;

location = /error.html {
    root             /path/to/errors/nginx-ssi;
    ssi              on;
    ssi_value_length 1024;
    internal;
}

# Hashed build files never change, so they can be cached for a long time.
# (`expires` doesn't use add_header, so server-level headers are still inherited.)
location /assets/ {
    expires 1y;
    try_files $uri =404;
}

# Client-side routes get the app shell. Exact matches only, so /status/nodes/...
# keeps going to the websocket proxy.
location ~ ^/(projects|status)/?$ {
    try_files /index.html =404;
}

# Everything else: real files, otherwise a real 404 with your error page.
location / {
    try_files $uri $uri/ =404;
}
```

Add a route to that regex whenever you add a page in `src/App.tsx`. Check the config with `nginx -t` before reloading.

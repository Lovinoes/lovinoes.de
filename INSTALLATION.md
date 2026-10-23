# Installation

The website is a set of static files built from this repo and served by nginx. Nothing else has to keep running.

Replace `/path/to/site` below with wherever you clone the repo.

## First-time setup

### 1. Requirements

`git` and **Node.js 22.22 or newer** (check with `node -v`).

### 2. Get the code

```bash
git clone https://github.com/Lovinoes/lovinoes.de.git /path/to/site
```

### 3. Build it

```bash
cd /path/to/site && npm ci && npm run build
```

### 4. nginx

In the site's `server { }` block (HTTPS):

```nginx
    root  /path/to/site/dist;
    index index.html;

    gzip            on;
    gzip_vary       on;
    gzip_comp_level 6;
    gzip_types      text/css application/javascript application/json image/svg+xml application/manifest+json;

    # Every error page comes from the website itself.
    error_page 400 401 403 404 405 406 407 408 412 413 414 415 429 431 500 501 502 503 504 /index.html;

    # "ssi on" tells the page its status code, "expires epoch" stops browsers caching old copies.
    location = /index.html {
        ssi     on;
        expires epoch;
    }

    # Built files have a hash in their name, so they can be cached for a year.
    location /assets/ {
        expires 1y;
        try_files $uri =404;
    }

    # Pages of the website. Add new ones here when you add them in src/App.tsx.
    location ~ ^/(projects|status)/?$ {
        rewrite ^ /index.html last;
    }

    location / {
        try_files $uri $uri/ =404;
    }
```

The favicons (`/favicons/...`) aren't part of this repo. Put them in `public/favicons/` before building, or serve them from another folder with a `location /favicons/ { root ...; }` block.

Then:

```bash
nginx -t && systemctl reload nginx
```

## Updating

```bash
cd /path/to/site && git pull && npm ci && npm run build -- --outDir dist-new && rm -rf dist-old && mv dist dist-old && mv dist-new dist
```

This builds into `dist-new` while the live site keeps running from `dist`, and only swaps the folders once the build has finished. Building straight into `dist` would delete the old files first, so anyone loading the page during those seconds gets a broken page. If the build fails, nothing is swapped and the site stays as it was.

The previous build stays in `dist-old`. To roll back:

```bash
cd /path/to/site && rm -rf dist-broken && mv dist dist-broken && mv dist-old dist
```

nginx doesn't need a reload for updates.

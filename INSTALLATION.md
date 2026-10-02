# Hosting lovinoes.de

The website is a set of static files. nginx serves them, so nothing else has to keep running: as long as nginx runs, the site is online.

nginx does two things:

- serve the website from `/var/www/lovinoes` (including all error pages, which are part of the website)
- reverse proxy the status nodes (`/status/nodes/...`)

All steps run on the server as root.

## First-time setup

### 1. Install the tools

You need `git`, `rsync` and **Node.js 24**. Check what's there:

```bash
git --version
rsync --version
node -v
```

Install whatever is missing with your distro's package manager. For Node.js, use version 24 from https://nodejs.org/en/download (choose Linux and your package manager).

### 2. Get the code

```bash
git clone https://github.com/Lovinoes/lovinoes.de.git /opt/lovinoes.de
```

### 3. Build and put it live

```bash
bash /opt/lovinoes.de/deploy.sh
```

This builds the site and copies it to `/var/www/lovinoes`. Your `favicons/` folder there is kept; old files from the previous website are removed.

### 4. Configure nginx

Open `/etc/nginx/sites-available/lovinoes.de.conf`.

Leave the first three `server { }` blocks (the redirects) as they are. Replace the fourth one, `# apex (HTTPS) - main site`, with this, and fill in your three tokens:

```nginx
# apex (HTTPS) - main site
server {
    listen      443 ssl;
    listen      443 quic;
    listen      [::]:443 ssl;
    listen      [::]:443 quic;
    server_name lovinoes.de;
    limit_req   zone=lovinoes burst=5;

    root  /var/www/lovinoes;
    index index.html;

    http2    on;
    http3    on;
    sendfile off;
    include  /etc/nginx/snippets/ssl-lovinoes.conf;

    add_header Alt-Svc 'h3=":443"; ma=86400' always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy same-origin always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), fullscreen=(self), clipboard-read=(self)" always;
    add_header Content-Security-Policy "frame-ancestors 'self'" always;

    keepalive_timeout  75;
    keepalive_requests 100;

    gzip            on;
    gzip_vary       on;
    gzip_comp_level 6;
    gzip_types      text/css application/javascript application/json image/svg+xml application/manifest+json;

    # ----- website -----

    # Every error is shown by the website itself.
    error_page 400 401 403 404 405 406 407 408 412 413 414 415 429 431 500 501 502 503 504 /index.html;

    # The page itself. "ssi on" lets nginx tell it the status code (404, 502, ...),
    # "expires epoch" stops browsers from keeping an outdated copy.
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

    # ----- status nodes (reverse proxy) -----

    # --- node: hde01 ---
    location /status/nodes/hde01/api/ {
        limit_req           zone=statusapi burst=10 nodelay;
        proxy_pass          http://10.0.0.2:8090/api/;
        proxy_set_header    Authorization "Bearer YOUR_HDE01_TOKEN";
        proxy_http_version  1.1;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $remote_addr;
        proxy_set_header    X-Forwarded-Proto $scheme;
        add_header          Cache-Control "no-store" always;
    }
    location = /status/nodes/hde01/ws {
        limit_conn          statusws 5;
        proxy_pass          http://10.0.0.2:8090/ws;
        proxy_set_header    Authorization "Bearer YOUR_HDE01_TOKEN";
        proxy_http_version  1.1;
        proxy_set_header    Upgrade $http_upgrade;
        proxy_set_header    Connection $connection_upgrade;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $remote_addr;
        proxy_read_timeout  3600;
        proxy_send_timeout  3600;
    }

    # --- node: hde02 ---
    location /status/nodes/hde02/api/ {
        limit_req           zone=statusapi burst=10 nodelay;
        proxy_pass          http://10.0.0.4:8090/api/;
        proxy_set_header    Authorization "Bearer YOUR_HDE02_TOKEN";
        proxy_http_version  1.1;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $remote_addr;
        proxy_set_header    X-Forwarded-Proto $scheme;
        add_header          Cache-Control "no-store" always;
    }
    location = /status/nodes/hde02/ws {
        limit_conn          statusws 5;
        proxy_pass          http://10.0.0.4:8090/ws;
        proxy_set_header    Authorization "Bearer YOUR_HDE02_TOKEN";
        proxy_http_version  1.1;
        proxy_set_header    Upgrade $http_upgrade;
        proxy_set_header    Connection $connection_upgrade;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $remote_addr;
        proxy_read_timeout  3600;
        proxy_send_timeout  3600;
    }

    # --- node: hde03 ---
    location /status/nodes/hde03/api/ {
        limit_req           zone=statusapi burst=10 nodelay;
        proxy_pass          http://127.0.0.1:8090/api/;
        proxy_set_header    Authorization "Bearer YOUR_HDE03_TOKEN";
        proxy_http_version  1.1;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $remote_addr;
        proxy_set_header    X-Forwarded-Proto $scheme;
        add_header          Cache-Control "no-store" always;
    }
    location = /status/nodes/hde03/ws {
        limit_conn          statusws 5;
        proxy_pass          http://127.0.0.1:8090/ws;
        proxy_set_header    Authorization "Bearer YOUR_HDE03_TOKEN";
        proxy_http_version  1.1;
        proxy_set_header    Upgrade $http_upgrade;
        proxy_set_header    Connection $connection_upgrade;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $remote_addr;
        proxy_read_timeout  3600;
        proxy_send_timeout  3600;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Compared to your old block, this:

- drops `include /etc/nginx/snippets/error-page.conf;` (the website shows the errors now)
- adds the `gzip` lines and the `website` section
- changes nothing about the status node proxies

### 5. Reload nginx

```bash
nginx -t && systemctl reload nginx
```

`nginx -t` checks the config first. If it prints an error, nothing changes and the old config keeps running.

### 6. Start nginx on boot

```bash
systemctl enable nginx
```

Done. The site is live and comes back by itself after a reboot.

## Updating the site

After pushing changes to GitHub, run on the server:

```bash
bash /opt/lovinoes.de/deploy.sh
```

That's all. It pulls the latest code, builds it and puts it live. nginx doesn't need a reload.

## Optional: faster page loads

A page load requests about 8 files at once. With `burst=5`, nginx spaces those requests out. Adding `nodelay` serves them right away. In the main site block, change

```nginx
    limit_req   zone=lovinoes burst=5;
```

to

```nginx
    limit_req   zone=lovinoes burst=20 nodelay;
```

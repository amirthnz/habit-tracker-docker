# Habit Tracker 🎟️

## Publish to GitHub (first time)

This folder is not yet a Git repository. Install Git and sign in to GitHub,
then create a **new empty repository** on GitHub (do not initialize it with a
README, `.gitignore`, or license). From this project's root folder, run:

```bash
git init -b main
git add .
git status --short                     # review the files before committing
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub account and new
repository name. GitHub may prompt you to authenticate (use a credential
manager or personal access token for HTTPS, not your GitHub password). If Git
asks for your name or email, set them with `git config --global user.name
"Your Name"` and `git config --global user.email "you@example.com"`, then
retry the commit. Check `git status --short` before committing: local `.env`
files, databases, dependencies, and build output must not be uploaded. Keep
`.env.example` files and `Habit-Tracker/package-lock.json` in the commit.

For later changes, run `git add .`, `git commit -m "Describe changes"`, and
`git push`. The VPS instructions below can then clone your new repository.

---

A full-stack habit tracker: a **React + Vite + TypeScript** frontend with a
**Django (DRF + JWT)** backend API. Earn **Golden Tickets** for perfect days and
spend them in the **Ticket Vault** on real-life prizes.

This repository ships with a production-ready Docker setup: one command brings
up an nginx server that serves the app on **port 80** and proxies `/api` to the
Django backend.

---

## Architecture

```
Browser ──► :80 nginx (web)                ← serves the built Vite SPA
                 │  /api/*, /admin/*, /static/*  (proxied)
                 ▼
             :8000 Django + Gunicorn (api) ← auto-runs migrations on start
                 │
                 ▼
         SQLite on a Docker volume        ← data survives rebuilds/restarts
```

| Container | Image base | Purpose |
|---|---|---|
| `web` | node:22 build → nginx:1.27 | Static SPA on port 80 + reverse proxy |
| `api` | python:3.14-slim | Django REST API (gunicorn), migrations + collectstatic on start |

---

## Local development (without Docker)

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt   # Windows
# source venv/bin/activate && pip install -r requirements.txt   # Linux/macOS
venv\Scripts\python manage.py migrate
venv\Scripts\python manage.py runserver        # http://127.0.0.1:8000
```

**Frontend** (dev server proxies `/api` to `127.0.0.1:8000`)

```bash
cd Habit-Tracker
npm install
npm run dev                                    # http://localhost:3000
```

---

## Deploy to a VPS (the app live on port 80)

### Step 1 — Install Docker on the VPS

Works on Ubuntu 22.04/24.04, Debian 12, and most other distros.

```bash
# 1. Install Docker Engine + the Compose plugin (official convenience script)
curl -fsSL https://get.docker.com | sh

# 2. Verify
docker --version
docker compose version

# 3. (Ubuntu/Debian) run docker without sudo
sudo usermod -aG docker $USER
newgrp docker        # or log out and back in
```

Optional but recommended: enable the firewall and allow only SSH + HTTP/HTTPS.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> **Note:** if you prefer installing Docker via `apt` manually, follow the
> official guide at <https://docs.docker.com/engine/install/ubuntu/> — the
> script above does the same thing in one step.

### Step 2 — Get the code onto the VPS

```bash
# With git (recommended)
git clone https://github.com/<you>/<your-repo>.git habit-tracker
cd habit-tracker

# ...or upload your local copy (run this from your Windows machine):
# scp -r d:\Projects\vite\habbit\* user@YOUR_VPS_IP:~/habit-tracker/
```

### Step 3 — Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in at minimum:

```ini
GEMINI_API_KEY=AIza...            # optional, enables AI badges/coaching
DJANGO_SECRET_KEY=<paste the output of the command below>
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=*            # or your domain(s) once you have them
```

Generate a secret key (on any machine with Python):

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Step 4 — Build and start

```bash
docker compose up -d --build
```

What happens now:

1. The **api** image builds (Python 3.14 + dependencies), starts, applies all
   migrations into `/data/db.sqlite3` on the persistent `sqlite-data` volume,
   collects admin static files, and serves the API with gunicorn.
2. The **web** image builds the Vite bundle (`npm ci && npm run build`), then
   nginx serves it on **port 80** and proxies `/api` → the api container.
3. nginx waits for the api health check before starting.

Verify:

```bash
docker compose ps                 # both services should be "running (healthy)"
curl -I http://localhost          # should answer HTTP 200 (the SPA)
curl  http://localhost/api/health # or any API route, from a browser
```


### Step 5 — Create an admin user (optional)

```bash
docker compose exec api python manage.py createsuperuser
```

Then open `http://YOUR_VPS_IP/admin/` (the Django admin is proxied by nginx).

### Step 6 — Updating the app

```bash
cd habit-tracker
git pull                          # or re-upload changed files
docker compose up -d --build      # rebuilds, restarts, keeps the database
```

Migrations run automatically on every api container start, so schema changes
apply themselves.

---

## Data, backups, and troubleshooting

**Where is my data?** The SQLite database lives in the `sqlite-data` Docker
volume at `/data/db.sqlite3` inside the api container — it survives `down`,
`up`, and rebuilds. Back it up with:

```bash
docker compose cp api:/data/db.sqlite3 ./backup-$(date +%F).sqlite3
```

Restore a backup:

```bash
docker compose cp ./backup-2026-10-20.sqlite3 api:/data/db.sqlite3
docker compose restart api
```

See the logs:

```bash
docker compose logs -f api        # Django/gunicorn output
docker compose logs -f web        # nginx access/error log
```

**Common problems**

| Symptom | Fix |
|---|---|
| `400 Bad Request` on API calls with a domain | Add your domain to `DJANGO_ALLOWED_HOSTS` and restart: `docker compose up -d` |
| CSRF errors on the admin login over HTTPS | Set `DJANGO_CSRF_TRUSTED_ORIGINS=https://yourdomain.com` in `.env` |
| Port 80 already in use | Stop the other service (`sudo systemctl stop nginx`) or change the mapping to `"8080:80"` in `docker-compose.yml` |
| API returns 502 | `docker compose logs api` — usually migrations still running or a crash loop; restart with `docker compose restart api` |
| Forgot admin password | `docker compose exec api python manage.py changepassword <username>` |

---

## HTTPS (optional)

The stack is HTTP-only on port 80 by design. To add TLS, put a reverse proxy in
front — [Caddy](https://caddyserver.com/) is the easiest (automatic Let's
Encrypt certificates):

1. Point your domain's DNS A record at the VPS IP.
2. Install Caddy on the host (`sudo apt install caddy`) and use this
   `/etc/caddy/Caddyfile`:

```
yourdomain.com {
    reverse_proxy localhost:80
}
```

3. Add `DJANGO_CSRF_TRUSTED_ORIGINS=https://yourdomain.com` and
   `DJANGO_ALLOWED_HOSTS=yourdomain.com` to `.env`, then
   `docker compose up -d`.

Caddy terminates TLS on 443 and forwards to the nginx container on port 80 —
no changes to the Docker setup are needed.

---

## Running tests

```bash
# Backend (Django)
cd backend && venv\Scripts\python manage.py test          # Windows
cd backend && python manage.py test                       # Linux/macOS

# Frontend logic tests
cd Habit-Tracker
node_modules\.bin\tsx --test src\utils\habitLogic.test.ts

# Type check
cmd /c node node_modules\typescript\bin\tsc --noEmit
```

---

## Project layout

```
├── Habit-Tracker/          # React + Vite frontend
│   ├── Dockerfile          # build stage → nginx, serves on port 80
│   ├── nginx.conf          # static serving + /api reverse proxy
│   └── src/                # App, components, utils
├── backend/                # Django project
│   ├── Dockerfile          # python:3.14-slim + gunicorn
│   ├── requirements.txt
│   ├── api/                # models, serializers, views, tests
│   └── config/             # settings, urls, wsgi
├── docker-compose.yml      # web + api production stack
└── .env.example            # copy to .env and fill in
```

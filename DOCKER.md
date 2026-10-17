# Docker Deployment & Command Guide

This guide explains how to run the entire **CareerForge AI** ecosystem locally using Docker and Docker Compose, along with a simple explanation of every command, port mapping, and troubleshooting scenario.

---

## 1. System Architecture

Docker spins up 4 isolated containers connected through an internal Docker bridge network:

```
                  ┌──────────────────────────────────────────────┐
                  │            Internal Docker Network           │
                  │                                              │
Browser ──:3000──►│ careerforge-client (Next.js 14)              │
                  │        │                                     │
                  │        ▼ (Internal API calls)                │
Browser ──:5000──►│ careerforge-server (Node.js / Express)       │
                  │        │                   │                 │
                  │        ▼                   ▼                 │
                  │ careerforge-mongodb   careerforge-redis      │
                  │   (Mongo 7.0)           (Redis 7.2)          │
                  └──────────────────────────────────────────────┘
```

| Service Container | Internal Port | Host Port (Your PC) | Purpose |
| :--- | :--- | :--- | :--- |
| **careerforge-client** | `3000` | `http://localhost:3000` | Next.js Frontend UI & Resume Studio |
| **careerforge-server** | `5000` | `http://localhost:5000` | Express REST API & Swagger (`/api/docs`) |
| **careerforge-mongodb** | `27017` | `localhost:27017` | Document Database |
| **careerforge-redis** | `6379` | `localhost:6379` | Caching & Rate Limiting |

---

## 2. Quick Start (Run with One Command)

From the project root directory, run:

```bash
docker compose up --build -d
```

### What This Command Does:
* `docker compose up`: Reads `docker-compose.yml` and starts all 4 services in the correct order (`mongodb` & `redis` first, then `server`, then `client`).
* `--build`: Builds the Docker images from `./server/Dockerfile` and `./client/Dockerfile` with the latest code changes.
* `-d` (Detached): Runs the containers silently in the background so your terminal remains free.

### Access the Application:
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
* **Interactive Swagger Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 3. Seed Demo Accounts Inside Docker

Once the containers are up and running, populate all demo users (Admin, 2 Consultants, Candidate, and Resumes) directly inside the container:

```bash
docker compose exec server npm run seed
```

Or seed only the platform administrator:

```bash
docker compose exec server npm run seed:admin
```

---

## 4. Complete Docker Command Reference

### Starting & Stopping

| Command | Simple Explanation |
| :--- | :--- |
| `docker compose up -d` | Starts all services in the background (uses existing images). |
| `docker compose up --build -d` | **Rebuilds** images with fresh code edits and starts in background. |
| `docker compose stop` | Pauses/stops all running containers without deleting them. |
| `docker compose start` | Resumes previously stopped containers quickly. |
| `docker compose restart` | Restarts all containers (useful when applying environment changes). |
| `docker compose down` | Stops and safely removes containers and internal networks. |
| `docker compose down -v` | **Full Reset**: Stops containers and **deletes MongoDB & Redis data volumes**. Use this when you want a completely fresh database. |

---

### Monitoring & Logs

| Command | Simple Explanation |
| :--- | :--- |
| `docker compose ps` | Displays the current running state and **port mappings** of all containers. |
| `docker compose logs -f` | Streams real-time live logs from **all 4 services** together. Press `Ctrl + C` to exit. |
| `docker compose logs -f server` | Streams live logs from the **backend server only**. |
| `docker compose logs -f client` | Streams live logs from the **frontend client only**. |
| `docker compose top` | Displays the active Linux processes running inside each container. |

---

### Debugging & Shell Access

| Command | Simple Explanation |
| :--- | :--- |
| `docker compose exec server sh` | Opens an interactive terminal shell inside the **backend container**. |
| `docker compose exec client sh` | Opens an interactive terminal shell inside the **frontend container**. |
| `docker compose exec mongodb mongosh careerforge` | Opens the interactive MongoDB CLI shell to inspect database collections directly. |
| `docker compose exec redis redis-cli ping` | Tests if Redis is responsive (returns `PONG`). |

---

## 5. How Docker Ports Work (Understanding `PORTS`)

When you run `docker compose ps`, inspect the `PORTS` column:

### Good (Port is Mapped to Your Computer):
```text
0.0.0.0:3000->3000/tcp
```
* **Meaning**: Docker created a bridge between your PC (`0.0.0.0:3000`) and the container (`3000`).
* **Result**: You can open `http://localhost:3000` in your Chrome/Edge browser.

### Bad (Port is Trapped Inside the Container):
```text
3000/tcp
```
* **Meaning**: Port 3000 is open internally, but Docker has **no doorway** connected to your host PC.
* **Result**: Your browser displays `ERR_CONNECTION_REFUSED`.
* **Fix**: Run `docker compose down` followed by `docker compose up -d` to rebind the ports from `docker-compose.yml`.

---

## 6. Troubleshooting Common Issues

### Issue 1: "Port 3000 or 5000 is already in use"
* **Cause**: Another local Node.js process (`npm run dev`) or another Docker container is already using the port.
* **Fix on Windows (PowerShell)**:
  ```powershell
  # Find what process is using port 3000 or 5000:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

  # Stop conflicting processes or run:
  docker compose down
  ```

### Issue 2: Frontend shows "Cannot reach server" or network errors
* **Cause**: The client needs to communicate with `http://localhost:5000/api` from the browser.
* **Fix**: Ensure `careerforge-server` is in the `Up` state in `docker compose ps` and verify its logs:
  ```bash
  docker compose logs server
  ```

### Issue 3: Code changes are not showing up inside the container
* **Cause**: Production Docker containers package code at build time.
* **Fix**: Rebuild the containers using the `--build` flag:
  ```bash
  docker compose up --build -d
  ```

### Issue 4: Resetting the entire Docker environment
If you experience any stuck states, run this one-line cleanup and restart:
```bash
docker compose down -v && docker compose up --build -d
```
Then re-seed the test data:
```bash
docker compose exec server npm run seed
```

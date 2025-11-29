# 🌌 Fugue — Ephemeral Anonymous Chat

> **"A conversation that leaves no trace."**  
> Inspired by the *fugue state* — a temporary amnesic condition — **Fugue** is a secure, in-memory, peer-to-peer chat where **nothing persists**.
 
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitLab-FC6D26?logo=gitlab)](https://gitlab.com/umarmahmoodshk-group/fugue-app/-/pipelines)
[![Deployed on AWS](https://img.shields.io/badge/Deployed-AWS_EC2-FF9900?logo=amazon-aws)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?logo=docker)](https://hub.doc## 🙏 Acknowledgments

- Built as part of the Trinity Bootstrap project
- Real-time functionality powered by WebSocket (`ws` library)
- Deployed on AWS EC2 with GitLab CI/CD automation
- Session-based authentication with PostgreSQL store
- Containerized with Docker and Docker Compose

---

**⭐ Star this repo if you found it helpful!**

> **"We met in the fog. We spoke. We vanished."**  
> — Fugue v1.0Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![React + Vite](https://img.shields.io/badge/React%20+%20Vite-61DAFB?logo=react)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)e — Ephemeral Anonymous Chat

> **“A conversation that leaves no trace.”**  
> Inspired by the *fugue state* — a temporary amnesic condition — **Fugue** is a secure, in-memory, peer-to-peer chat where **nothing persists**.
 
[![Deployed with CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=github)](https://github.com/umarmahmoodshk/fugue-app/actions)
[![Docker](https://img.shields.io/badge/Docker-18%2Balpine-2496ED?logo=docker)](https://hub.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![React + Vite](https://img.shields.io/badge/React%20+%20Vite-61DAFB?logo=react)](https://vitejs.dev/)

---
## ✨ Features

| Feature | Description |
|--------|-------------|
| 🔐 **Account-Based Access** | Users sign up and log in with username + password. Sessions persist via secure cookies until logout. |
| 🎯 **Interest Matching** | Select multiple interests; chat pairing prioritises shared interests with optional "extend search" fallback. |
| 🔄 **Real-Time Sync** | WebSocket-powered live messaging with automatic pairing and partner presence events. |
| 🚪 **Leave Any Time** | Leave chat without logging out — return to the lobby with a single click. |
| 🧼 **Ephemeral by Design** | Messages live only in memory — nothing saved after disconnect. |
| 🎨 **Dark Mode UI** | Clean Tailwind UI with responsive layout. |
| 🐳 **Docker-Ready** | Dev & prod Dockerfiles with Docker Compose orchestration. |
| 🔄 **CI/CD Pipeline** | Automated testing, building, and deployment to AWS via GitLab CI/CD. |

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js v18+
- PostgreSQL (local or remote). The default dev DSN expects a local database named `fugue_app`.
- Docker (optional, for container testing)

### 1. Install dependencies
```bash
# Clone the repo
git clone https://github.com/umarmahmoodshk/fugue-app.git
cd fugue-app

# Backend deps
npm install

# Frontend deps
npm install --prefix client
```

### 2. Configure Postgres
```bash
# Create the local database (optional if you supply DATABASE_URL)
createdb fugue_app
```
Create a `.env` in the project root if you want to override defaults:
```env
DATABASE_URL=postgres://user:password@localhost:5432/fugue_app
SESSION_SECRET=super-secret
```

### 3. Run the app
```bash
# Start the backend (ensures schema automatically)
npm run dev

# Option A: run the Vite dev server (hot reload)
npm run dev --prefix client
#   visit http://localhost:5173

# Option B: build the client once and let Express serve it
npm run build:client
#   reload http://localhost:8080
```
Sign up with a username/password, pick interests, then start matching. Use the **Leave** button to exit a chat without logging out.

---

## 🐳 Docker Usage

### Development Environment (Docker Compose)
```bash
# Start all services (database, backend, frontend)
docker-compose -f docker-compose.dev.yml up -d

# View running containers
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```
👉 Access frontend at **http://localhost:5173** and backend at **http://localhost:8080**

### Production Environment (Docker Compose)
```bash
# Start all services in production mode
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:8080/health

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop services
docker-compose -f docker-compose.prod.yml down
```
👉 Production-ready deployment with optimized builds and security configurations

### Manual Docker Build (Advanced)
```bash
# Build backend only
docker build -f backend/Dockerfile.prod -t fugue-backend:latest ./backend

# Build frontend only
docker build -f frontend/Dockerfile.prod -t fugue-frontend:latest ./frontend

# Run manually
docker run -d -p 8080:8080 --env-file .env fugue-backend:latest
docker run -d -p 80:80 fugue-frontend:latest
```

---

## 🔄 CI/CD Pipeline (GitLab CI/CD)

Automated deployment pipeline with GitLab CI/CD:

| Branch | Pipeline Action |
|-------|------------------|
| `MB` | ✅ Run tests → 🏗️ Build images → 🚀 Deploy to AWS Staging |
| `main` | ✅ Run tests → 🏗️ Build images → 🚀 Deploy to AWS Production |

**Pipeline Stages:**
1. **Build** - Create optimized Docker images and push to GitLab Container Registry
2. **Test** - Run backend and frontend test suites
3. **Deploy** - SSH to EC2, pull latest code, restart containers with health checks

📁 See: [`.gitlab-ci.yml`](./.gitlab-ci.yml) for complete pipeline configuration

---

## 📂 Project Structure

```
fugue-app/
├── client/               # React + Vite frontend
│   ├── src/              # Components, hooks, styles
│   └── vite.config.js    # Dev server config (host: 0.0.0.0)
├── index.js              # Node.js + WebSocket backend
├── package.json          # Backend dependencies
├── Dockerfile.dev        # Dev container (backend only)
├── Dockerfile.prod       # Production container (full app)
├── .gitignore
└── .github/workflows/ci.yml
```

---

## 🔐 Privacy & Security

- **No data persistence**: All state is in-memory (server + browser).
- **No logs**: Backend never stores messages after disconnect.
- **Anti-screenshot**: UI blurs on logout.
- **No tracking**: Zero analytics, cookies, or telemetry.

> 🕊️ **Fugue respects your right to forget.**

---

## 🌍 Deployment Guide

### 🚀 AWS EC2 Deployment

#### Prerequisites
- AWS EC2 instance (Ubuntu 22.04 recommended)
- Docker and Docker Compose installed on EC2
- SSH access to your EC2 instance
- Domain name or EC2 public IP

#### Step 1: Prepare EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

#### Step 2: Configure Security Groups

Ensure your EC2 security group allows:
- **Port 22** (SSH)
- **Port 80** (HTTP)
- **Port 443** (HTTPS)
- **Port 8080** (Backend API)
- **Port 5173** (Frontend - Dev only)

#### Step 3: Deploy Application

```bash
# Create application directory
mkdir -p /home/ubuntu/fugue-app
cd /home/ubuntu/fugue-app

# Clone your repository (will be automated via CI/CD)
git clone https://gitlab.com/your-username/fugue-app.git .

# Create production environment file
nano .env
```

**Production `.env` configuration:**
```env
# Database Configuration
POSTGRES_DB=fugue_app
POSTGRES_USER=fugue_user
POSTGRES_PASSWORD=your-secure-password-here
DB_PORT=5433

# Backend Configuration
BACKEND_PORT=8080
SESSION_SECRET=generate-with-openssl-rand-base64-32
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=80
VITE_API_URL=http://your-ec2-ip:8080
VITE_WS_URL=ws://your-ec2-ip:8080
```

```bash
# Generate secure SESSION_SECRET
openssl rand -base64 32

# Start the application
docker-compose -f docker-compose.prod.yml up -d

# Verify containers are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Step 4: Configure Nginx (Optional - for domain)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/fugue
```

**Nginx configuration example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/fugue /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 🦊 GitLab CI/CD Configuration

#### Step 1: Configure GitLab CI/CD Variables

Navigate to: **GitLab Project → Settings → CI/CD → Variables**

Add the following variables:

| Variable Name | Value | Protected | Masked | Description |
|--------------|-------|-----------|--------|-------------|
| `SSH_PRIVATE_KEY` | Your SSH private key | ✅ | ✅ | SSH key for EC2 access |
| `STAGING_HOST` | `your-ec2-ip` | ✅ | ❌ | EC2 public IP or domain |
| `STAGING_USER` | `ubuntu` | ✅ | ❌ | EC2 SSH username |
| `POSTGRES_PASSWORD` | Strong password | ✅ | ✅ | Database password |
| `SESSION_SECRET` | 44-char base64 string | ✅ | ✅ | Session encryption key |

**Generate secure secrets:**
```bash
# Generate SESSION_SECRET (32 bytes base64 = 44 chars)
openssl rand -base64 32

# Generate POSTGRES_PASSWORD
openssl rand -base64 24
```

#### Step 2: Configure Protected Branches

Navigate to: **GitLab Project → Settings → Repository → Protected Branches**

- Add branch: `main` or `MB`
- Allowed to merge: Maintainers
- Allowed to push: Maintainers
- ✅ Protect this branch

> ⚠️ **Important:** Protected variables only work on protected branches!

#### Step 3: Set Up SSH Key

```bash
# On your local machine, generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "gitlab-ci@fugue-app"

# Copy the private key content
cat ~/.ssh/id_ed25519

# Add to GitLab as SSH_PRIVATE_KEY variable

# Copy the public key to your EC2 instance
ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@your-ec2-ip

# Or manually add to EC2
ssh ubuntu@your-ec2-ip
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key here
chmod 600 ~/.ssh/authorized_keys
```

#### Step 4: GitLab Runner Configuration (Self-Hosted)

If using GitLab.com runners, skip this step. For self-hosted runners:

```bash
# On your EC2 instance or separate runner server
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt install gitlab-runner

# Register the runner
sudo gitlab-runner register
# Follow prompts:
# - GitLab URL: https://gitlab.com/
# - Registration token: (from GitLab Settings → CI/CD → Runners)
# - Description: fugue-app-runner
# - Tags: docker,aws,deploy
# - Executor: docker
# - Default image: docker:24

# Start the runner
sudo gitlab-runner start
```

#### Step 5: Pipeline Workflow

The `.gitlab-ci.yml` pipeline includes:

1. **Build Stage**
   - Builds backend Docker image
   - Builds frontend Docker image
   - Pushes to GitLab Container Registry

2. **Test Stage**
   - Runs backend tests (`npm test`)
   - Runs frontend tests (`npm test`)

3. **Deploy Stage** (Protected branches only)
   - SSH into EC2 instance
   - Pull latest code
   - Update environment variables
   - Restart Docker containers
   - Verify health checks

**Trigger deployment:**
```bash
# Push to protected branch
git add .
git commit -m "feat: Add new feature"
git push origin main  # or MB

# Pipeline will automatically:
# 1. Build and test
# 2. Deploy to AWS staging environment
# 3. Run health checks
```

#### Step 6: Monitor Pipeline

Navigate to: **GitLab Project → CI/CD → Pipelines**

- View pipeline status
- Check job logs
- Monitor deployment progress
- Verify health checks pass

**Pipeline Success Indicators:**
- ✅ Build jobs complete
- ✅ Test jobs pass
- ✅ Deploy job completes
- ✅ Health check returns `{"status":"OK"}`

---

### 🔍 Troubleshooting Deployment

#### Common Issues

**1. SSH Connection Failed**
```bash
# Test SSH manually
ssh -i ~/.ssh/id_ed25519 ubuntu@your-ec2-ip

# Check SSH key permissions
chmod 600 ~/.ssh/id_ed25519

# Verify public key on EC2
cat ~/.ssh/authorized_keys
```

**2. Docker Container Won't Start**
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs database

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

**3. Database Connection Failed**
```bash
# Verify PostgreSQL is running
docker-compose -f docker-compose.prod.yml exec database psql -U fugue_user -d fugue_app

# Check DATABASE_URL format
echo $DATABASE_URL

# Reset database
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

**4. Session Secret Not Working**
```bash
# Verify SESSION_SECRET is set
docker-compose -f docker-compose.prod.yml exec backend printenv | grep SESSION_SECRET

# Regenerate and update
openssl rand -base64 32
# Update in GitLab CI/CD Variables and .env
```

**5. GitLab Pipeline Fails**
- Check if branch is protected
- Verify all CI/CD variables are set
- Review job logs in GitLab
- Ensure SSH_PRIVATE_KEY has no passphrase
- Verify EC2 security group allows SSH from GitLab runners

---

### 📊 Production Monitoring

#### Health Checks
```bash
# Backend health endpoint
curl http://your-ec2-ip:8080/health

# Expected response
{"status":"OK","timestamp":"2025-11-29T...","service":"fugue-backend","version":"1.0.0"}

# WebSocket connection test
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://your-ec2-ip:8080
```

#### Container Monitoring
```bash
# View running containers
docker ps

# Monitor resource usage
docker stats

# View logs in real-time
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Check container health
docker inspect --format='{{.State.Health.Status}}' <container-id>
```

#### Application Logs
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Database logs
docker-compose -f docker-compose.prod.yml logs database
```

---

## 🙌 Contributing

This is a **learning project** aligned with the **Trinity Bootstrap** DevOps workflow.  
Feel free to:
- ✨ Improve UI/UX
- 🧪 Add unit tests
- 🚀 Add cloud deployment scripts

---

<p align="center">
  <img src="https://user-images.githubusercontent.com/1209810/188273181-9a9d8b0f-8f5a-4c0e-9f3e-3a0b3e4e4e4e.gif" width="100%" alt="Fugue: Ephemeral Chat" />
</p>

## 🔧 Key Features Implementation

### Real-time WebSocket Communication
- Automatic user pairing system
- Room-based chat management
- Connection health monitoring
- Graceful disconnect handling

### Production Optimizations
- Multi-stage Docker builds for minimal image size
- Non-root user execution for security
- Environment-based configuration
- Cloud Run with WebSocket support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built as part of the Trinity Bootstrap project
- Real-time functionality powered by WebSockets
- Deployed on Google Cloud Platform
- Continuous deployment via GitHub Actions

---

**⭐ Star this repo if you found it helpful!**

> **“We met in the fog. We spoke. We vanished.”**  
> — Fugue v1.0

---

## 🌍 Live Deployment

**✅ Deployed on AWS EC2 with GitLab CI/CD**

- **Staging Environment:** Auto-deployed from `MB` branch
- **Production Environment:** Auto-deployed from `main` branch
- **Container Registry:** GitLab Container Registry
- **Orchestration:** Docker Compose
- **CI/CD:** GitLab Pipelines with automated testing and deployment

### Deployment Architecture

```
GitLab Repository (MB/main branch)
        ↓
   GitLab CI/CD Pipeline
   ├── Build Stage (Docker images)
   ├── Test Stage (npm test)
   └── Deploy Stage (SSH to EC2)
        ↓
   AWS EC2 Instance (Ubuntu 22.04)
   ├── PostgreSQL Container (Port 5433)
   ├── Backend Container (Port 8080)
   └── Frontend Container (Port 5173)
```

**Access:** Check with your team for the current deployment URL

# 🌌 Fugue — Ephemeral Anonymous Chat

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
| 🔒 **Ephemeral by Design** | All messages live **only in browser memory** — gone on refresh, logout, or disconnect. |
| 👥 **Anonymous Pairing** | Enter a name → instantly matched with a stranger. No accounts. No history. |
| 🌐 **Real-Time Sync** | WebSocket-powered live messaging with auto-pairing. |
| 🧼 **One-Click Logout** | Blurs screen on exit to prevent screenshots. |
| 🎨 **Dark Mode UI** | Clean, modern interface with Tailwind CSS. |
| 🐳 **Docker-Ready** | Dev & prod Dockerfiles included. |
| 🔄 **CI/CD Pipeline** | Automated testing, building, and deployment via GitHub Actions. |

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js v18+
- Docker (optional, for container testing)

### Run Locally
```bash
# Clone the repo
git clone https://github.com/umarmahmoodshk/fugue-app.git
cd fugue-app

# Install backend
npm install

# Install frontend
cd client && npm install && cd ..

# Start backend
npm start

# In a new terminal, start frontend
cd client && npm run dev
```

👉 Open **http://localhost:5173** in **two tabs** → chat anonymously!

---

## 🐳 Docker Usage

### Build & Run Dev Image (Backend Only)
```bash
docker build -f Dockerfile.dev -t fugue-dev .
docker run -p 3000:3000 fugue-dev
```
> Keep frontend running via `npm run dev` in `client/`.

### Build & Run Production Image (Full App)
```bash
docker build -f Dockerfile.prod -t fugue-prod .
docker run -p 3000:3000 fugue-prod
```
👉 Visit **http://localhost:3000** — frontend + backend in one container!

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Based on the **Trinity Bootstrap** workflow:

| Branch | Pipeline Action |
|-------|------------------|
| `dev` | ✅ Run tests → 🏗️ Build dev image |
| `main` | ✅ Run tests → 🏗️ Build prod image → 🚀 Push to GHCR |

📁 See: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

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

## 🌍 Deploy to Cloud (Coming Soon)

- [ ] Fly.io (1-command deploy)
- [ ] Render
- [ ] AWS ECS

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

**✅ Currently deployed on Google Cloud Run:**
[**Try Fugue Live**](https://fugue-app-5jxy74mbza-uc.a.run.app)

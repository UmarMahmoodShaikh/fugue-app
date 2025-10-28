```markdown
# 🎵 Fugue - Real-time P2P Chat Application

A modern, anonymous peer-to-peer chat application built with real-time WebSocket technology and deployed on Google Cloud Platform.

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-18-green)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-Run-blue)
![CI/CD](https://img.shields.io/badge/CI/CD-GitHub_Actions-success)

## 🚀 Live Demo
**[Try Fugue Live Now!](https://fugue-app-5jxy74mbza-uc.a.run.app)**

## ✨ Features

- **Real-time Messaging**: Instant WebSocket-based communication
- **Anonymous Chat**: No accounts or registration required
- **Smart Pairing**: Automatic user matching system  
- **Modern UI**: Beautiful interface with TailwindCSS & Lucide React icons
- **Cloud Native**: Full CI/CD with Docker and Google Cloud Run
- **Production Ready**: HTTPS, security headers, and monitoring

## 🛠️ Tech Stack

**Frontend:**
- ⚛️ React 19 + Vite
- 🎨 TailwindCSS + Lucide React icons
- 🔌 WebSocket Client

**Backend:**
- 🟢 Node.js + Express
- 📡 WebSocket Server (ws library)
- 🐳 Docker containerization

**DevOps & Cloud:**
- 🔄 GitHub Actions CI/CD
- ☁️ Google Cloud Run (serverless)
- 📦 Artifact Registry
- 🔒 Automatic HTTPS/WSS

## 🏗️ Project Structure

```
fugue-app/
├── client/                 # React Frontend
│   ├── src/               # Components & Logic
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── index.js               # Express + WebSocket Server
├── package.json           # Backend dependencies
├── Dockerfile.prod        # Multi-stage production build
└── .github/workflows/     # CI/CD pipeline configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker

### Local Development
```bash
# Clone repository
git clone https://github.com/UmarMahmoodShaikh/fugue-app.git
cd fugue-app

# Install backend dependencies
npm install

# Install frontend dependencies and build
cd client
npm install
npm run build
cd ..

# Start development server
npm start
```

### Production Build with Docker
```bash
# Build production image
docker build -f Dockerfile.prod -t fugue-app .

# Run container
docker run -p 8080:8080 fugue-app
```

## 📦 Deployment

This project features full CI/CD automation:

1. **Push to main branch** triggers GitHub Actions
2. **Automated testing** of frontend and backend
3. **Docker multi-stage build** creates optimized image
4. **Push to Google Artifact Registry**
5. **Automatic deployment to Google Cloud Run**

### Manual Deployment
```bash
# Build and push to Google Container Registry
docker build -f Dockerfile.prod -t fugue-app .
docker tag fugue-app gcr.io/fugue-app-476509/fugue-app:latest
docker push gcr.io/fugue-app-476509/fugue-app:latest

# Deploy to Cloud Run
gcloud run deploy fugue-app \
  --image gcr.io/fugue-app-476509/fugue-app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built as part of the Trinity Bootstrap project
- Real-time functionality powered by WebSockets
- Deployed on Google Cloud Platform
- Continuous deployment via GitHub Actions

---

**⭐ Star this repo if you found it helpful!**
```

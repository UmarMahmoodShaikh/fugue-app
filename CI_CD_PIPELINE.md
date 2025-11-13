# Fugue CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline for the Fugue P2P Chat application. The pipeline includes 7 stages with extensive testing, security scanning, and deployment automation.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Pipeline Stages                           │
├─────────────────────────────────────────────────────────────┤
│ 1. 🔍 Code Quality & Linting                                 │
│ 2. 🧪 Backend Tests (Health, API, WebSocket)                 │
│ 3. 🎨 Frontend Build & Tests                                 │
│ 4. ⚡ Performance & Load Tests                               │
│ 5. 🔒 Security Scanning                                      │
│ 6. 🐳 Docker Build & Validation (dev branch)                │
│ 7. 🚀 Production Build, Push & Deploy (main branch)         │
└─────────────────────────────────────────────────────────────┘
```

## Triggers

The pipeline is triggered on:
- **Push** to `main` or `dev` branches
- **Pull Request** to `main` branch

## Stage Descriptions

### Stage 1: Code Quality & Linting 🔍

**Purpose**: Ensure code quality and consistency across the codebase.

**Steps**:
- Checkout code
- Setup Node.js 18
- Install backend and frontend dependencies
- Lint backend code with ESLint
- Lint frontend code with ESLint
- Check code formatting

**Non-blocking**: Linting failures are warnings, not pipeline failures.

---

### Stage 2: Backend Tests 🧪

**Purpose**: Validate backend functionality with comprehensive tests.

**Steps**:
- Run health check test (`npm test`)
- Run API endpoint tests (`npm run test:api`)
- Run WebSocket integration tests (`npm run test:websocket`)
- Verify server startup

**Tests Included**:
- ✅ Health endpoint validation
- ✅ API endpoint testing
- ✅ WebSocket connection testing
- ✅ WebSocket pairing functionality
- ✅ Server startup verification

**Dependencies**: Requires `lint` stage to pass

---

### Stage 3: Frontend Build & Tests 🎨

**Purpose**: Build and validate the React frontend application.

**Steps**:
- Install frontend dependencies
- Build production frontend (`npm run build`)
- Verify build artifacts exist
- Check bundle size
- Upload build artifacts

**Validations**:
- ✅ index.html exists in dist/
- ✅ Bundle size is reasonable (<10MB)
- ✅ Build artifacts are preserved

**Dependencies**: Requires `lint` stage to pass

---

### Stage 4: Performance & Load Tests ⚡

**Purpose**: Ensure the application can handle expected load.

**Steps**:
- Run performance tests (`npm run test:performance`)
- Test concurrent HTTP requests (200 requests, 50 concurrent)
- Test concurrent WebSocket connections (10 concurrent)
- Validate response times and success rates

**Performance Thresholds**:
- Success rate: >95%
- Average latency: <1000ms
- Concurrent WebSocket connections: 10+

**Dependencies**: Requires `test-backend` and `test-frontend` stages to pass

---

### Stage 5: Security Scanning 🔒

**Purpose**: Identify security vulnerabilities and exposed secrets.

**Steps**:
- Run `npm audit` on backend dependencies
- Run `npm audit` on frontend dependencies
- Check for exposed secrets in code

**Scans For**:
- High and critical CVEs in dependencies
- Exposed API keys, passwords, secrets
- Sensitive data in code

**Dependencies**: Requires `test-backend`, `test-frontend`, and `performance-test` stages to pass

---

### Stage 6: Docker Build & Validation (Dev) 🐳

**Purpose**: Build and test development Docker image.

**Conditions**: Only runs on `dev` branch

**Steps**:
- Build development Docker image
- Run container in test mode
- Verify container starts successfully
- Display build summary

**Validations**:
- ✅ Docker image builds successfully
- ✅ Container starts and runs
- ✅ Container can be stopped cleanly

**Dependencies**: Requires all test and security stages to pass

---

### Stage 7: Production Build, Push & Deploy (Main) 🚀

**Purpose**: Deploy application to Google Cloud Run.

**Conditions**: Only runs on `main` branch

**Steps**:

1. **Build Phase**:
   - Authenticate to Google Cloud
   - Build production Docker image
   - Test container locally
   - Run Trivy security scan on image

2. **Push Phase**:
   - Push image to Google Artifact Registry
   - Tag with commit SHA and `latest`

3. **Deploy Phase**:
   - Deploy to Google Cloud Run
   - Configure auto-scaling (1-10 instances)
   - Set environment variables
   - Enable session affinity for WebSocket

4. **Validation Phase**:
   - Test root endpoint
   - Test health endpoint
   - Test WebSocket info endpoint
   - Test WebSocket connection
   - Run basic load test (10 concurrent requests)

5. **Reporting Phase**:
   - Display deployment summary
   - Report service URL
   - Notify deployment status

**Cloud Run Configuration**:
- Region: `us-central1`
- Memory: 512Mi
- CPU: 1
- Port: 8080
- Timeout: 3600s (1 hour for long WebSocket connections)
- Min instances: 1
- Max instances: 10
- Public access: Enabled

**Dependencies**: Requires all test and security stages to pass

---

## Test Files

### Backend Tests

1. **`test/backend.test.js`** - Health check and server startup
2. **`test/api.test.js`** - API endpoint validation
3. **`test/websocket.test.js`** - WebSocket integration tests
4. **`test/performance.test.js`** - Performance and load testing

### Running Tests Locally

```bash
# Install dependencies
npm ci

# Run individual test suites
npm test                    # Health check test
npm run test:api           # API endpoint tests
npm run test:websocket     # WebSocket tests
npm run test:performance   # Performance tests

# Run all tests
npm run test:all
```

---

## Environment Variables

### Required Secrets

- `GCP_SA_KEY` - Google Cloud Service Account JSON key

### Environment Configuration

```yaml
GCP_PROJECT_ID: 'fugue-app-476509'
GCP_REGION: 'us-central1'
ARTIFACT_REGISTRY_REPO: 'fugue-app'
```

---

## Pipeline Workflow

### Development Branch (`dev`)

```
Push to dev
  ↓
Lint → Backend Tests → Frontend Tests → Performance Tests → Security Scan
  ↓
Dev Docker Build & Test
  ↓
✅ Complete
```

### Production Branch (`main`)

```
Push to main
  ↓
Lint → Backend Tests → Frontend Tests → Performance Tests → Security Scan
  ↓
Production Build → Container Test → Security Scan
  ↓
Push to Artifact Registry
  ↓
Deploy to Cloud Run
  ↓
Health Checks → WebSocket Test → Load Test
  ↓
✅ Live in Production
```

---

## Success Criteria

A deployment is considered successful when:

1. ✅ All linting passes (or warnings only)
2. ✅ All backend tests pass
3. ✅ Frontend builds successfully
4. ✅ Performance tests meet thresholds
5. ✅ No critical security vulnerabilities
6. ✅ Docker image builds and runs
7. ✅ Deployment health checks pass
8. ✅ WebSocket functionality validated
9. ✅ Load test completes successfully

---

## Failure Handling

### Automatic Rollback

- Cloud Run keeps previous revision
- Manual rollback available via GCP Console

### Debugging Failed Deployments

1. Check GitHub Actions logs
2. Review container logs: `docker logs <container-name>`
3. Check Cloud Run logs in GCP Console
4. Verify environment variables
5. Test locally with Docker

---

## Monitoring & Observability

### Deployment Metrics

The pipeline reports:
- Build time
- Test coverage
- Bundle size
- Performance metrics
- Security scan results
- Deployment URL

### Post-Deployment

- Health endpoint: `https://your-service-url/health`
- WebSocket info: `https://your-service-url/websocket-info`
- Cloud Run metrics in GCP Console

---

## Best Practices

1. **Always test locally before pushing**
   ```bash
   npm run test:all
   docker build -f Dockerfile.prod -t fugue-test .
   docker run -p 8080:8080 fugue-test
   ```

2. **Use feature branches**
   - Create feature branches from `dev`
   - Open PR to `dev` for testing
   - Merge `dev` to `main` for production

3. **Monitor pipeline performance**
   - Review test execution times
   - Optimize slow tests
   - Keep dependencies updated

4. **Security first**
   - Never commit secrets
   - Review security scan results
   - Update vulnerable dependencies

---

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
- **Solution**: Increase timeout values in test files

**Issue**: Docker build fails
- **Solution**: Clear Docker cache, verify Dockerfile syntax

**Issue**: Deployment health check fails
- **Solution**: Verify PORT environment variable, check server logs

**Issue**: WebSocket connection fails
- **Solution**: Verify Cloud Run timeout settings, check session affinity

---

## Future Enhancements

- [ ] Add code coverage reporting
- [ ] Implement canary deployments
- [ ] Add Slack/Discord notifications
- [ ] Set up automatic rollback on failure
- [ ] Add E2E browser testing
- [ ] Implement blue-green deployment strategy
- [ ] Add performance monitoring dashboards

---

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review this documentation
3. Contact DevOps team
4. Open an issue in the repository

---

**Last Updated**: November 13, 2025
**Pipeline Version**: 1.0
**Maintainer**: DevOps Team


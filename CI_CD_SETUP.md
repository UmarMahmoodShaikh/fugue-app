# GitLab CI/CD Variables Configuration

This document lists the environment variables that need to be configured in your GitLab project for the CI/CD pipeline to work properly.

## 📋 Required Variables

### 🐳 **Docker Registry Variables** (Auto-configured by GitLab)
- `CI_REGISTRY` - GitLab Container Registry URL
- `CI_REGISTRY_IMAGE` - Full image name for your project
- `CI_REGISTRY_USER` - Registry username (auto-set to `gitlab-ci-token`)
- `CI_REGISTRY_PASSWORD` - Registry password (auto-set)

### 🔐 **Environment-Specific Variables**

#### **Staging Environment**
Set these in GitLab: Settings → CI/CD → Variables

| Variable | Type | Value | Protected | Masked |
|----------|------|-------|-----------|---------|
| `STAGING_POSTGRES_PASSWORD` | Variable | `your-staging-db-password` | ✅ | ✅ |
| `STAGING_SESSION_SECRET` | Variable | `your-staging-session-secret` | ✅ | ✅ |
| `STAGING_DATABASE_URL` | Variable | `postgresql://user:pass@host:5432/db` | ✅ | ❌ |

#### **Production Environment**
Set these in GitLab: Settings → CI/CD → Variables

| Variable | Type | Value | Protected | Masked |
|----------|------|-------|-----------|---------|
| `PROD_POSTGRES_PASSWORD` | Variable | `your-production-db-password` | ✅ | ✅ |
| `PROD_SESSION_SECRET` | Variable | `your-production-session-secret` | ✅ | ✅ |
| `PROD_DATABASE_URL` | Variable | `postgresql://user:pass@host:5432/db` | ✅ | ❌ |

### 🚀 **Deployment Variables** (Optional)
| Variable | Type | Value | Description |
|----------|------|-------|-------------|
| `DEPLOY_HOST` | Variable | `your-server.com` | Target deployment server |
| `DEPLOY_USER` | Variable | `deploy` | SSH user for deployment |
| `DEPLOY_SSH_KEY` | File | `-----BEGIN PRIVATE KEY-----` | SSH private key for deployment |

## 🔧 **How to Set Variables**

1. Go to your GitLab project
2. Navigate to **Settings → CI/CD**
3. Expand the **Variables** section
4. Click **Add Variable**
5. Fill in:
   - **Key**: Variable name (e.g., `PROD_POSTGRES_PASSWORD`)
   - **Value**: Your secret value
   - **Type**: Variable or File
   - **Environment scope**: All (default) or specific environment
   - **Protect variable**: ✅ (for sensitive data)
   - **Mask variable**: ✅ (for passwords and secrets)

## 🏃‍♂️ **Pipeline Behavior**

### **On Feature Branches / MRs:**
- ✅ Install dependencies
- ✅ Lint code
- ✅ Run tests
- ✅ Security scan
- ❌ Build Docker images
- ❌ Deploy

### **On `develop` Branch:**
- ✅ Install dependencies
- ✅ Lint code
- ✅ Run tests
- ✅ Security scan
- ✅ Build Docker images
- 🔄 Deploy to staging (manual trigger)

### **On `main` Branch:**
- ✅ Install dependencies
- ✅ Lint code
- ✅ Run tests
- ✅ Security scan
- ✅ Build Docker images
- 🔄 Deploy to production (manual trigger)

## 🛠 **Local Testing**

Before pushing to GitLab, you can test the pipeline locally:

```bash
# Run tests
npm run test:backend
npm run test:frontend

# Run linting
npm run lint:backend
npm run lint:frontend

# Build Docker images
docker build -f backend/Dockerfile.prod -t fugue-backend backend/
docker build -f frontend/Dockerfile.prod -t fugue-frontend frontend/

# Test the application
docker-compose -f docker-compose.prod.yml up
```

## 🔍 **Troubleshooting**

### Common Issues:

1. **Missing Variables**: Check that all required variables are set in GitLab CI/CD settings
2. **Docker Build Fails**: Ensure Dockerfile paths are correct
3. **Test Failures**: Run tests locally first to debug
4. **Deploy Fails**: Check server connectivity and SSH keys

### Debug Commands:

```bash
# Check if variables are available in pipeline
echo "Registry: $CI_REGISTRY_IMAGE"
echo "Commit: $CI_COMMIT_SHA"

# Test Docker connectivity
docker info

# Test database connectivity
pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER
```
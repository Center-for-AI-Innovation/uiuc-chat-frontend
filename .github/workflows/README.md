# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the UIUC Chat Frontend project.

## 📁 Available Workflows

### `deploy-to-ecs.yml` - ECS Deployment
Automatically deploys the frontend application to AWS ECS Fargate on code changes.

### `e2e-prod-status-test.yml` - E2E Testing
Runs end-to-end tests against the production environment.

## 🚀 ECS Deployment - How It Works

The `deploy-to-ecs.yml` workflow triggers on pushes to `illinois-chat` branch when these files change:
- `src/**` - React/Next.js source code
- `pages/**` - Next.js pages (if using pages router)
- `components/**` - React components
- `lib/**` - Utility libraries
- `public/**` - Static assets
- `styles/**` - CSS/styling files
- `package.json` - Node.js dependencies
- `package-lock.json` - Dependency lock file
- `next.config.mjs` - Next.js configuration
- `next-i18next.config.mjs` - Internationalization config
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `Dockerfile` - Container configuration
- `.github/workflows/deploy-to-ecs.yml` - This workflow file

## ⚙️ ECS Deployment - Configuration

Update these environment variables in `deploy-to-ecs.yml` to match your AWS setup:

```yaml
env:
  AWS_REGION: us-east-2
  ECR_REPOSITORY: uiuc-chat-frontend
  ECS_SERVICE: frontend-service-358yl957
  ECS_CLUSTER: uiuc-chat-dev
  ECS_TASK_DEFINITION: frontend
  CONTAINER_NAME: frontend
```

## 🔑 ECS Deployment - Required Secrets

Add these secrets in GitHub repository settings for ECS deployment:

### AWS Credentials:
- `AWS_ACCESS_KEY_ID` - AWS access key with ECR and ECS permissions
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key

### Frontend Build Environment Variables:
- `NEXT_PUBLIC_KEYCLOAK_REALM` - Keycloak realm name
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` - Keycloak client ID
- `NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG` - "True" to use Illinois Chat config which controls the appearance 
- `NEXT_PUBLIC_ILLINOIS_CHAT_BANNER_CONTENT` - Illinois Chat Banner content HTML
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog analytics key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL

## 📋 ECS Deployment - Process

1. **Build** - Creates Docker image with Next.js production build
2. **Environment** - Injects Keycloak configuration during build
3. **Push** - Uploads image to ECR repository
4. **Update** - Downloads current ECS task definition
5. **Deploy** - Updates ECS service with new image
6. **Wait** - Ensures deployment completes successfully

## ⏱️ Typical Timing
- **Total**: 8-15 minutes
- **Build & Push**: 5-10 minutes (includes npm install & build)
- **ECS Deployment**: 3-5 minutes

## 🛡️ Safety Features

- **Zero downtime** - Rolling deployment keeps frontend accessible
- **Health checks** - New tasks must pass health endpoint checks
- **Automatic rollback** - Failed deployments revert automatically
- **Previous versions preserved** - Manual rollback always possible
- **Multi-stage build** - Optimized production image with minimal attack surface

## 🔧 ECS Deployment - Manual Trigger

Trigger ECS deployment manually via GitHub Actions tab → "Run workflow" button on `deploy-to-ecs.yml`.

## 📊 Monitoring

- **GitHub Actions**: Watch workflow progress in Actions tab
- **ECS Console**: Monitor deployment in AWS ECS service console
- **CloudWatch**: View application logs in `/ecs/uiuc-chat-frontend` log group

## 🚫 ECS Deployment - Skip Conditions

Changes to these files won't trigger ECS deployment:
- Documentation (`*.md`, `docs/**`)
- Test files (`__tests__/**`, `*.test.*`, `*.spec.*`)
- VS Code config (`.vscode/**`)
- Linting configs (`.eslintrc.*`, `.prettierrc.*`)
- Git files (`.gitignore`, `.gitattributes`)
- CI configs for other workflows (`nightwatch/**`)

## 🔍 ECS Deployment - Troubleshooting

### Common Issues:
- **Missing secrets**: Add AWS credentials and Keycloak config to repository secrets
- **Permission errors**: Ensure IAM user has ECR and ECS permissions
- **Build failures**: Check Node.js dependencies and build scripts
- **Environment variable errors**: Verify Keycloak configuration secrets
- **Health check failures**: Check if Next.js app starts correctly on port 3000

### Next.js Specific Issues:
- **Build errors**: Check `next.config.mjs` and TypeScript configuration
- **Runtime errors**: Verify environment variables are properly injected
- **Static asset issues**: Ensure `public/` files are copied correctly
- **i18n issues**: Check `next-i18next.config.mjs` configuration

### Quick Commands:
```bash
# Check ECS service status
aws ecs describe-services --cluster uiuc-chat-dev --services frontend-service-358yl957

# View recent logs
aws logs tail /ecs/uiuc-chat-frontend --follow

# Force new deployment (if needed)
aws ecs update-service --cluster uiuc-chat-dev --service frontend-service-358yl957 --force-new-deployment

# Check ECR repository
aws ecr describe-repositories --repository-names uiuc-chat-frontend

# List recent images
aws ecr describe-images --repository-name uiuc-chat-frontend --query 'imageDetails[*].[imageTags[0],imagePushedAt]' --output table
```

## 🏗️ Frontend-Specific Notes

### Build Process:
- **Multi-stage Docker build**: Separates build dependencies from runtime
- **Environment injection**: Keycloak URLs injected during build via build args
- **Production optimization**: Uses `npm run build:self-hosted` for optimized assets
- **Static asset handling**: Public files and built assets properly copied

### Dependencies:
- **Node.js 18**: Alpine-based images for smaller size
- **Build tools**: Python3, pip, make, g++ for native dependencies
- **Runtime**: Only production dependencies in final image

### Configuration:
- **Next.js**: App router with internationalization support
- **Tailwind CSS**: Utility-first styling framework
- **TypeScript**: Type-safe development
- **Keycloak**: Authentication integration

### Performance:
- **Image optimization**: Multi-stage build reduces final image size
- **Caching**: Leverages Docker layer caching for dependencies
- **Static assets**: Properly handled for CDN delivery
- **Bundle analysis**: Available via `npm run analyze`

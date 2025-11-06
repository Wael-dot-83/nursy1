# 🔄 CI/CD Integration Guide

This guide explains how to run the Nursery Management System in CI/CD pipelines.

## Overview

The Docker Compose setup supports CI/CD through:
- **Compose profiles** for minimal service sets
- **Healthchecks** for readiness verification
- **Test containers** for isolated testing
- **Exit codes** for pipeline integration

## Quick Start

```bash
# CI-friendly one-liner
docker compose --profile test up --build --abort-on-container-exit --exit-code-from test
```

## Compose Profiles

### Available Profiles

| Profile | Services | Use Case |
|---------|----------|----------|
| (default) | db, redis, backend, frontend | Full stack |
| `dev` | + adminer | Local development |
| `test` | db, redis, backend, test | Unit/integration tests |
| `e2e` | All services | End-to-end tests |

### Usage

```bash
# Run only test services
docker compose --profile test up --build

# Run dev services (includes Adminer)
docker compose --profile dev up

# Run specific profile
docker compose --profile e2e up
```

## GitHub Actions

### Complete Workflow

`.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  DOCKER_BUILDKIT: 1
  COMPOSE_DOCKER_CLI_BUILD: 1

jobs:
  # ==================== Linting ====================
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install linters
        run: |
          pip install flake8 black mypy
      
      - name: Run flake8
        run: flake8 nursery-system/backend/app --max-line-length=120
      
      - name: Check black formatting
        run: black --check nursery-system/backend/app
      
      - name: Run mypy
        run: mypy nursery-system/backend/app --ignore-missing-imports

  # ==================== Backend Tests ====================
  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Create .env file
        run: cp .env.docker .env
      
      - name: Build test image
        run: docker compose --profile test build
      
      - name: Run tests with coverage
        run: |
          docker compose --profile test run --rm test \
            pytest -v --cov=app --cov-report=xml --cov-report=term-missing
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          flags: backend
      
      - name: Cleanup
        if: always()
        run: docker compose --profile test down -v

  # ==================== Frontend Tests ====================
  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: nursery-system/frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: nursery-system/frontend
        run: npm ci
      
      - name: Run tests
        working-directory: nursery-system/frontend
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./nursery-system/frontend/coverage/coverage-final.json
          flags: frontend

  # ==================== Integration Tests ====================
  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Create .env file
        run: cp .env.docker .env
      
      - name: Build images
        run: docker compose build
      
      - name: Start services
        run: docker compose up -d
      
      - name: Wait for services to be healthy
        run: |
          timeout 120 bash -c '
            until docker compose ps | grep -q "healthy"; do
              echo "Waiting for services to be healthy..."
              sleep 5
            done
          '
      
      - name: Run smoke tests
        run: bash ./scripts/smoke.sh
      
      - name: Check logs for errors
        if: failure()
        run: docker compose logs
      
      - name: Cleanup
        if: always()
        run: docker compose down -v

  # ==================== E2E Tests ====================
  test-e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: [test-integration]
    steps:
      - uses: actions/checkout@v4
      
      - name: Create .env file
        run: cp .env.docker .env
      
      - name: Build and start services
        run: |
          docker compose build
          docker compose up -d
      
      - name: Wait for services
        run: |
          timeout 120 bash -c '
            until curl -f http://localhost:4173/health > /dev/null 2>&1; do
              echo "Waiting for frontend..."
              sleep 5
            done
          '
      
      - name: Setup Node.js for Playwright
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Playwright
        working-directory: nursery-system/e2e
        run: |
          npm ci
          npx playwright install --with-deps
      
      - name: Run Playwright tests
        working-directory: nursery-system/e2e
        run: npx playwright test
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: nursery-system/e2e/playwright-report/
          retention-days: 7
      
      - name: Cleanup
        if: always()
        run: docker compose down -v

  # ==================== Build Check ====================
  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build backend image
        uses: docker/build-push-action@v5
        with:
          context: ./nursery-system/backend
          file: ./nursery-system/backend/Dockerfile.local
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./nursery-system/frontend
          file: ./nursery-system/frontend/Dockerfile.local
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==================== Security Scan ====================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

### Minimal Test Workflow

`.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests
        run: |
          cp .env.docker .env
          docker compose --profile test up --build --abort-on-container-exit
      
      - name: Smoke tests
        run: |
          docker compose up -d
          sleep 30
          bash ./scripts/smoke.sh
      
      - name: Cleanup
        if: always()
        run: docker compose down -v
```

## GitLab CI

`.gitlab-ci.yml`:

```yaml
variables:
  DOCKER_DRIVER: overlay2
  DOCKER_BUILDKIT: 1
  COMPOSE_DOCKER_CLI_BUILD: 1

stages:
  - lint
  - test
  - build
  - deploy

# ==================== Linting ====================
lint:
  stage: lint
  image: python:3.11
  script:
    - pip install flake8 black
    - flake8 nursery-system/backend/app
    - black --check nursery-system/backend/app

# ==================== Backend Tests ====================
test:backend:
  stage: test
  image: docker/compose:latest
  services:
    - docker:dind
  before_script:
    - cp .env.docker .env
  script:
    - docker compose --profile test build
    - docker compose --profile test up --abort-on-container-exit --exit-code-from test
  after_script:
    - docker compose --profile test down -v

# ==================== Integration Tests ====================
test:integration:
  stage: test
  image: docker/compose:latest
  services:
    - docker:dind
  before_script:
    - cp .env.docker .env
    - docker compose build
    - docker compose up -d
  script:
    - sleep 30
    - docker compose exec -T backend curl -f http://localhost:8000/health
    - sh ./scripts/smoke.sh
  after_script:
    - docker compose logs
    - docker compose down -v

# ==================== Build ====================
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA -f nursery-system/backend/Dockerfile.local nursery-system/backend
    - docker build -t $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA -f nursery-system/frontend/Dockerfile.local nursery-system/frontend
  only:
    - main
    - develop
```

## Jenkins Pipeline

`Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    environment {
        COMPOSE_PROJECT_NAME = "nursy_ci_${BUILD_NUMBER}"
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'cp .env.docker .env'
                sh 'docker compose build'
            }
        }
        
        stage('Test Backend') {
            steps {
                sh 'docker compose --profile test run --rm test'
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'docker compose up -d'
                sh 'sleep 30'
                sh 'bash ./scripts/smoke.sh'
            }
        }
        
        stage('E2E Tests') {
            steps {
                dir('nursery-system/e2e') {
                    sh 'npm ci'
                    sh 'npx playwright install --with-deps'
                    sh 'npx playwright test'
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker compose down -v'
            cleanWs()
        }
    }
}
```

## CircleCI

`.circleci/config.yml`:

```yaml
version: 2.1

executors:
  docker-compose:
    machine:
      image: ubuntu-2204:2023.10.1

jobs:
  test:
    executor: docker-compose
    steps:
      - checkout
      - run:
          name: Setup
          command: cp .env.docker .env
      - run:
          name: Build
          command: docker compose build
      - run:
          name: Test
          command: docker compose --profile test up --abort-on-container-exit
      - run:
          name: Smoke Tests
          command: |
            docker compose up -d
            sleep 30
            bash ./scripts/smoke.sh
      - run:
          name: Cleanup
          when: always
          command: docker compose down -v

workflows:
  version: 2
  test-and-deploy:
    jobs:
      - test
```

## Best Practices

### 1. Use Compose Profiles

```bash
# Minimal services for fast tests
docker compose --profile test up

# Full stack for integration tests
docker compose up
```

### 2. Parallel Testing

```yaml
# GitHub Actions - run tests in parallel
jobs:
  test-backend:
    # ...
  test-frontend:
    # ...
  test-e2e:
    needs: [test-backend, test-frontend]
```

### 3. Cache Docker Layers

```yaml
# GitHub Actions with buildx cache
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### 4. Health Checks

```bash
# Wait for services to be ready
until docker compose ps | grep -q "healthy"; do
  sleep 5
done
```

### 5. Cleanup

```bash
# Always cleanup in CI
docker compose down -v
docker system prune -f
```

### 6. Test Artifacts

```yaml
# Save test reports
- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-reports
    path: test-reports/
```

## Debugging CI Failures

### View Logs

```yaml
- name: Show logs on failure
  if: failure()
  run: docker compose logs
```

### Interactive Debugging

```yaml
# GitHub Actions - debug with SSH
- name: Setup tmate session
  if: failure()
  uses: mxschmitt/action-tmate@v3
```

### Local CI Simulation

```bash
# Run exactly as CI does
cp .env.docker .env
docker compose --profile test build --no-cache
docker compose --profile test up --abort-on-container-exit
```

## Performance Optimization

### Build Cache

```dockerfile
# Use BuildKit cache mounts
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
```

### Parallel Builds

```bash
# Build images in parallel
docker compose build --parallel
```

### Minimal Test Image

```dockerfile
# Dockerfile.test - smaller test image
FROM python:3.11-slim
COPY requirements-test.txt .
RUN pip install -r requirements-test.txt
```

## See Also
- [SMOKE.md](./SMOKE.md) - Smoke testing guide
- [RUNBOOK.md](./RUNBOOK.md) - Operations guide
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitLab CI Docs](https://docs.gitlab.com/ee/ci/)

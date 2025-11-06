.PHONY: help build up down logs restart ps clean nuke migrate seed test web-test e2e smoke health db-shell backend-shell frontend-shell install-deps audit-fix

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)Nursery Management System - Docker Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Docker Operations

build: ## Build all Docker images (no cache)
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker compose build --no-cache

build-quick: ## Build Docker images (with cache)
	@echo "$(BLUE)Building Docker images (with cache)...$(NC)"
	docker compose build

up: ## Start all services
	@echo "$(GREEN)Starting all services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo ""
	@echo "Frontend: http://localhost:4173"
	@echo "Backend API: http://localhost:8000"
	@echo "Adminer: http://localhost:8080"
	@echo ""
	@make health

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart all services
	@make down
	@make up

logs: ## Follow logs for all services
	docker compose logs -f

logs-backend: ## Follow backend logs only
	docker compose logs -f backend

logs-frontend: ## Follow frontend logs only
	docker compose logs -f frontend

ps: ## Show running containers
	docker compose ps

##@ Database Operations

migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	docker compose exec backend python -c "from app.database import init_db; init_db(); print('✓ Migrations complete')"

seed: ## Run database seeds (idempotent)
	@echo "$(BLUE)Seeding database...$(NC)"
	docker compose exec backend python -c "from app.seed import seed_database; seed_database()"

db-shell: ## Open PostgreSQL shell
	@echo "$(BLUE)Opening database shell...$(NC)"
	docker compose exec db psql -U nursery_user -d nursery_db

db-reset: ## Reset database (DANGER: deletes all data)
	@echo "$(RED)⚠️  WARNING: This will delete ALL data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(RED)Dropping database...$(NC)"; \
		docker compose down -v; \
		docker compose up -d db; \
		sleep 5; \
		docker compose up -d backend; \
		sleep 10; \
		make migrate; \
		make seed; \
		echo "$(GREEN)✓ Database reset complete$(NC)"; \
	else \
		echo "$(GREEN)Cancelled$(NC)"; \
	fi

##@ Testing

test: ## Run backend unit and integration tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	docker compose --profile test run --rm test

test-cov: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	docker compose --profile test run --rm test pytest -v --cov=app --cov-report=html:/test-reports/coverage --cov-report=term-missing
	@echo "$(GREEN)Coverage report: ./test-reports/coverage/index.html$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	docker compose --profile test run --rm test pytest-watch

web-test: ## Run frontend unit tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	docker compose exec frontend npm test

e2e: ## Run end-to-end tests with Playwright
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@if [ ! -d "./nursery-system/e2e" ]; then \
		echo "$(YELLOW)⚠️  E2E tests not configured yet$(NC)"; \
		echo "Run: npx playwright init in ./nursery-system/e2e"; \
	else \
		cd ./nursery-system/e2e && npx playwright test; \
	fi

smoke: ## Run smoke tests (quick API health checks)
	@echo "$(BLUE)Running smoke tests...$(NC)"
	@bash ./scripts/smoke.sh

a11y: ## Run accessibility audit on admin pages
	@echo "$(BLUE)Running accessibility audit...$(NC)"
	@echo "$(YELLOW)See ADMIN_AUDIT_REMEDIATION_PLAN.md for complete audit$(NC)"
	@echo ""
	@echo "$(BLUE)30 issues identified:$(NC)"
	@echo "  $(RED)Critical: 7$(NC)"
	@echo "  $(YELLOW)High: 18$(NC)"
	@echo "  $(GREEN)Medium: 5$(NC)"
	@echo ""
	@echo "$(BLUE)Estimated effort: 52.5 hours (6.5 days)$(NC)"
	@echo ""
	@echo "$(GREEN)Run 'make audit-fix' to start remediation$(NC)"

audit-fix: ## Start accessibility remediation (Sprint 1)
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE) Admin Accessibility Remediation$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)Sprint 1: Critical Foundations (16 hours)$(NC)"
	@echo ""
	@echo "Issues to fix:"
	@echo "  1. Dashboard semantic structure"
	@echo "  2. Users page structure + skip links"
	@echo "  3. Users table accessibility"
	@echo "  4. Notifications semantic structure"
	@echo "  5. Audit logs semantic structure"
	@echo "  6. Settings tabs ARIA pattern"
	@echo "  7. Global focus indicators"
	@echo "  8. Skip links implementation"
	@echo ""
	@echo "$(GREEN)See ADMIN_AUDIT_REMEDIATION_PLAN.md for detailed fixes$(NC)"

##@ Shell Access

backend-shell: ## Open shell in backend container
	docker compose exec backend /bin/bash

frontend-shell: ## Open shell in frontend container
	docker compose exec frontend /bin/sh

##@ Cleanup

clean: ## Stop services and remove containers
	@echo "$(YELLOW)Cleaning up containers...$(NC)"
	docker compose down --remove-orphans
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

nuke: ## DANGER: Stop services and remove volumes (deletes all data)
	@echo "$(RED)⚠️  WARNING: This will delete ALL data including volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v --remove-orphans; \
		docker volume prune -f; \
		echo "$(GREEN)✓ Nuclear cleanup complete$(NC)"; \
	else \
		echo "$(GREEN)Cancelled$(NC)"; \
	fi

##@ Utilities

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "Backend:"
	@curl -s http://localhost:8000/health | jq '.' || echo "$(RED)✗ Backend not responding$(NC)"
	@echo ""
	@echo "Frontend:"
	@curl -s http://localhost:4173/health || echo "$(RED)✗ Frontend not responding$(NC)"
	@echo ""
	@echo "Database:"
	@docker compose exec db pg_isready -U nursery_user -d nursery_db || echo "$(RED)✗ Database not ready$(NC)"
	@echo ""

install-deps: ## Install development dependencies on host
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd nursery-system/backend && pip install -r requirements.txt
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd nursery-system/frontend && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

dev-setup: ## First-time setup for development
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE) Nursery System - Development Setup$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@if [ ! -f ".env" ]; then \
		echo "$(YELLOW)Creating .env from .env.example...$(NC)"; \
		cp .env.example .env; \
	fi
	@echo "$(GREEN)✓ Environment file ready$(NC)"
	@echo ""
	@make build
	@echo ""
	@make up
	@echo ""
	@echo "$(GREEN)═══════════════════════════════════════$(NC)"
	@echo "$(GREEN) Setup Complete!$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(BLUE)Quick Start:$(NC)"
	@echo "  Frontend: http://localhost:4173"
	@echo "  Backend:  http://localhost:8000"
	@echo "  Adminer:  http://localhost:8080"
	@echo ""
	@echo "$(BLUE)Default Admin Credentials:$(NC)"
	@echo "  Email: admin@nursery.local"
	@echo "  Password: Admin123!"
	@echo ""
	@echo "$(BLUE)Next Steps:$(NC)"
	@echo "  make logs      - View logs"
	@echo "  make smoke     - Run smoke tests"
	@echo "  make test      - Run tests"
	@echo "  make a11y      - View accessibility audit"
	@echo ""

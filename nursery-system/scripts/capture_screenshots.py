"""
Automated screenshot capture for the Nursery Management System frontend.

Steps performed:
1. Launches the FastAPI backend (uvicorn) on port 8002.
2. Starts the Vite dev server on port 5174.
3. Uses Playwright (Chromium) to log in as each seeded role and capture
   predefined route screenshots.
4. Stores captures under docs/media/<role>/.

Prerequisites:
- `python -m playwright install`
- Database seeded via `python backend/seed_db.py`
- npm dependencies installed in `nursery-system/frontend`
"""

from __future__ import annotations

import asyncio
import os
import signal
import subprocess
import sys
import time
from contextlib import suppress
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Tuple, Optional

import requests
from playwright import async_playwright

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
OUTPUT_DIR = ROOT.parent / "docs" / "media"

BASE_URL = "http://127.0.0.1:5174"
BACKEND_URL = "http://127.0.0.1:8002"


@dataclass
class Shot:
    slug: str
    path: str
    wait_selector: Optional[str] = None


@dataclass
class RoleConfig:
    role: str
    email: str
    password: str
    shots: List[Shot]


ROLE_SHOTS: List[RoleConfig] = [
    RoleConfig(
        role="admin",
        email="admin@nursery.com",
        password="Admin123!",
        shots=[
            Shot("admin_dashboard", "/admin/dashboard"),
            Shot("admin_nurseries", "/admin/nurseries"),
            Shot("admin_users", "/admin/users"),
            Shot("admin_reports", "/admin/reports"),
            Shot("admin_audit_logs", "/admin/audit-logs"),
        ],
    ),
    RoleConfig(
        role="manager",
        email="manager@nursery.com",
        password="Manager123!",
        shots=[
            Shot("manager_dashboard", "/manager/dashboard"),
            Shot("manager_children", "/manager/children"),
            Shot("manager_supervisors", "/manager/supervisors"),
            Shot("manager_reports", "/manager/reports"),
        ],
    ),
    RoleConfig(
        role="supervisor",
        email="supervisor@nursery.com",
        password="Supervisor123!",
        shots=[
            Shot("supervisor_dashboard", "/supervisor/dashboard"),
            Shot("supervisor_reports", "/supervisor/reports"),
            Shot("supervisor_reports_create", "/supervisor/reports/create"),
        ],
    ),
    RoleConfig(
        role="parent",
        email="parent@nursery.com",
        password="Parent123!",
        shots=[
            Shot("parent_dashboard", "/parent/dashboard"),
            Shot("parent_children", "/parent/children"),
            Shot("parent_reports", "/parent/reports"),
            Shot("parent_notifications", "/parent/notifications"),
        ],
    ),
]


def wait_for_service(url: str, timeout: float = 30.0) -> None:
    """Poll a URL until it responds or timeout."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            response = requests.get(url, timeout=2)
            if response.status_code < 500:
                return
        except requests.RequestException:
            pass
        time.sleep(1)
    raise RuntimeError(f"Timed out waiting for service {url}")


def launch_backend() -> subprocess.Popen:
    env = os.environ.copy()
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8002",
        "--log-level",
        "warning",
    ]
    proc = subprocess.Popen(cmd, cwd=BACKEND_DIR, env=env)
    # Use direct backend health endpoint
    wait_for_service(f"{BACKEND_URL}/health")
    return proc


def launch_frontend() -> subprocess.Popen:
    env = os.environ.copy()
    cmd = ["npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "5174"]
    if os.name == "nt":
        cmd[0] = "npm.cmd"
    proc = subprocess.Popen(
        cmd,
        cwd=FRONTEND_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    # Use proxy health endpoint
    wait_for_service(f"{BASE_URL}/api/health")
    return proc


async def login(page: Page, email: str, password: str) -> None:
    await page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    # Switch to English for consistent UI text, if toggle is present.
    with suppress(Exception):
        await page.get_by_role("button", name="English").click()
        await page.wait_for_timeout(300)

    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')
    await page.wait_for_load_state("networkidle")
    # Allow post-login redirects and initial data fetches to complete.
    await page.wait_for_timeout(1500)


async def capture_role(playwright: Playwright, config: RoleConfig) -> None:
    browser = await playwright.chromium.launch()
    context = await browser.new_context(
        viewport={"width": 1440, "height": 900},
        locale="en-US",
        color_scheme="light",
    )
    page = await context.new_page()

    try:
        await login(page, config.email, config.password)

        role_dir = OUTPUT_DIR / config.role
        role_dir.mkdir(parents=True, exist_ok=True)

        for shot in config.shots:
            await page.goto(f"{BASE_URL}{shot.path}", wait_until="networkidle")
            if shot.wait_selector:
                with suppress(Exception):
                    await page.wait_for_selector(shot.wait_selector, timeout=5000)
            await page.wait_for_timeout(1500)
            target = role_dir / f"{shot.slug}.png"
            await page.screenshot(path=str(target), full_page=True)
            print(f"[+] Captured {shot.slug} -> {target.relative_to(ROOT.parent)}")

    finally:
        await context.close()
        await browser.close()


async def run_capture() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    backend_proc = launch_backend()
    frontend_proc = launch_frontend()

    try:
        async with async_playwright() as playwright:
            for config in ROLE_SHOTS:
                await capture_role(playwright, config)
    finally:
        for proc in (frontend_proc, backend_proc):
            with suppress(ProcessLookupError):
                if proc.poll() is None:
                    if os.name == "nt":
                        proc.send_signal(signal.CTRL_BREAK_EVENT)
                    else:
                        proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill()


if __name__ == "__main__":
    asyncio.run(run_capture())

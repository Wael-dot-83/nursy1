@echo off
REM Create venv and run backend
cd /d %~dp0\..\backend
IF NOT EXIST venv (
  py -3 -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
if not exist ".env" copy .env.example .env
cd /d %~dp0\..
backend\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8013

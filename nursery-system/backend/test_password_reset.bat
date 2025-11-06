@echo off
cd /d "%~dp0"
python -m pytest test_password_reset.py -v
pause

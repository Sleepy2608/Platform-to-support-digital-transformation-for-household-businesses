@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title HBDT - AI Service (FastAPI)

set "AI_DIR=Code\AI"
set "VENV=.venv"

echo ============================================================
echo   HBDT - KHOI DONG AI SERVICE (FastAPI - cong 8000)
echo ============================================================
echo.
echo   Chay lai voi tham so "reinstall" neu requirements.txt thay doi:
echo     run-ai.bat reinstall
echo.

if not exist "%AI_DIR%\main.py" (
    echo [LOI] Khong tim thay: %AI_DIR%\main.py
    echo       Hay chay file nay tu thu muc goc cua repo.
    goto :fail
)

where python >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua cai Python. Can Python 3.10 tro len.
    goto :fail
)

cd /d "%AI_DIR%"

if exist ".env" goto :env_ok
echo [CANH BAO] Chua co .env trong %AI_DIR%
if exist ".env.example" goto :copy_env
echo             Nhanh nay chua co .env.example.
echo             Neu can dung tinh nang AI that, tao file %AI_DIR%\.env gom:
echo               BAI_API_KEY=...
echo               BAI_MODEL=qwen3.8-flash
echo               AI_SERVICE_API_SECRET=...
echo.
goto :venv

:copy_env
copy /y ".env.example" ".env" >nul
echo             Da tao .env tu .env.example - hay mo file va dien BAI_API_KEY.
echo.
goto :venv

:env_ok
echo [OK] Da co %AI_DIR%\.env
echo.

:venv
if exist "%VENV%\Scripts\python.exe" goto :venv_ok
echo [1/2] Tao virtual environment tai %AI_DIR%\.venv ...
python -m venv "%VENV%"
if errorlevel 1 (
    echo [LOI] Tao virtual environment that bai.
    goto :fail
)

:venv_ok
if /i "%~1"=="reinstall" goto :do_install
if exist "%VENV%\.deps-ok" goto :run_server

:do_install
echo [2/2] Cai dependency tu requirements.txt ...
"%VENV%\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
    echo [LOI] Cai dependency that bai. Kiem tra ket noi mang roi thu lai.
    goto :fail
)
echo ok> "%VENV%\.deps-ok"
echo.

:run_server
echo [OK] Dang chay uvicorn tren cong 8000 ...
echo.
echo   Health check : http://127.0.0.1:8000/health
echo   Parse order  : http://127.0.0.1:8000/api/v1/ai/parse-order
echo   Ready check  : http://127.0.0.1:8000/api/v1/ai/ready
echo.
echo   Luu y: danh sach endpoint thuc te phu thuoc nhanh ban dang lam viec.
echo   Nhan Ctrl+C de dung server.
echo ------------------------------------------------------------
echo.

"%VENV%\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
set "CODE_EXIT=%ERRORLEVEL%"

echo.
if not "%CODE_EXIT%"=="0" (
    echo [LOI] Uvicorn dung voi ma loi %CODE_EXIT%.
    echo.
    echo   Neu log bao "NameError" hoac "SyntaxError": file Python trong AI_DIR dang
    echo   co loi cu phap - hay kiem tra Code\AI\src\*.py truoc khi chay lai.
    goto :fail
)

echo [OK] AI Service da dung binh thuong.
pause
exit /b 0

:fail
echo.
pause
exit /b 1

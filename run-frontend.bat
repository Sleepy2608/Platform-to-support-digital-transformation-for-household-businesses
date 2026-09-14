@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title HBDT - Frontend (Next.js)

set "FE_DIR=Code\Client\src\frontend"

echo ============================================================
echo   HBDT - KHOI DONG FRONTEND (Next.js - cong 3000)
echo ============================================================
echo.

if not exist "%FE_DIR%\package.json" (
    echo [LOI] Khong tim thay: %FE_DIR%\package.json
    echo       Hay chay file nay tu thu muc goc cua repo.
    goto :fail
)

where node >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua cai Node.js. Tai tai https://nodejs.org - khuyen nghi Node 20 tro len.
    goto :fail
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [LOI] Khong tim thay npm trong PATH.
    goto :fail
)

for /f "delims=" %%v in ('node -v') do set "NODE_VER=%%v"
echo [OK] Node.js %NODE_VER%

cd /d "%FE_DIR%"

if not exist "node_modules" (
    echo.
    echo [1/2] Chua co node_modules - dang chay "npm install" ...
    call npm install
    if errorlevel 1 (
        echo [LOI] "npm install" that bai. Kiem tra ket noi mang roi thu lai.
        goto :fail
    )
) else (
    echo [1/2] Da co node_modules - bo qua buoc cai dat.
)

echo.
echo [2/2] Dang chay "npm run dev" ...
echo.
echo   Trang chu        : http://localhost:3000/
echo   Owner / Employee : http://localhost:3000/login
echo   Admin            : http://localhost:3000/admin/login
echo.
echo   Neu cong 3000 dang bi chiem, Next.js co the tu doi sang cong khac.
echo   Hay xem dong "Local:" ma Next.js in ra ben duoi.
echo.
echo   Nhan Ctrl+C de dung server. Dong cua so nay de tat.
echo ------------------------------------------------------------
echo.

call npm run dev
set "CODE_EXIT=%ERRORLEVEL%"

echo.
if not "%CODE_EXIT%"=="0" (
    echo [LOI] "npm run dev" dung voi ma loi %CODE_EXIT%.
    echo.
    echo   Neu gap loi "Cannot find module" hoac trang bao 404:
    echo     hay chay file run-frontend-clean.bat de xoa .next, node_modules
    echo     va cai dat lai tu dau.
    goto :fail
)

echo [OK] Frontend da dung binh thuong.
pause
exit /b 0

:fail
echo.
pause
exit /b 1

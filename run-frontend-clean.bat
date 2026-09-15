@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title HBDT - Frontend CLEAN (Next.js)

set "FE_DIR=Code\Client\src\frontend"

echo ============================================================
echo   HBDT - FRONTEND CLEAN REBUILD
echo   Xoa .next + node_modules, cai lai va chay dev
echo ============================================================
echo.
echo   Dung file nay khi gap: loi "Cannot find module", trang bao 404,
echo   hoac giao dien khong cap nhat sau khi doi nhanh / cai them package.
echo.

if not exist "%FE_DIR%\package.json" (
    echo [LOI] Khong tim thay: %FE_DIR%\package.json
    echo       Hay chay file nay tu thu muc goc cua repo.
    goto :fail
)

set "CONFIRM="
set /p "CONFIRM=Xac nhan xoa .next va node_modules? [y/N]: "
if /i not "%CONFIRM%"=="y" (
    echo Da huy. Khong xoa gi ca.
    echo.
    pause
    exit /b 0
)

cd /d "%FE_DIR%"

echo.
echo [1/4] Xoa thu muc .next ...
if exist ".next" rmdir /s /q ".next"

echo [2/4] Xoa thu muc node_modules ...
if exist "node_modules" rmdir /s /q "node_modules"

echo [3/4] Chay "npm install" ...
call npm install
if errorlevel 1 (
    echo [LOI] "npm install" that bai. Kiem tra ket noi mang roi thu lai.
    goto :fail
)

echo.
echo [4/4] Dang chay "npm run dev" ...
echo.
echo   Trang chu        : http://localhost:3000/
echo   Owner / Employee : http://localhost:3000/login
echo   Admin            : http://localhost:3000/admin/login
echo.
echo   Nhan Ctrl+C de dung server. Dong cua so nay de tat.
echo ------------------------------------------------------------
echo.

call npm run dev
set "CODE_EXIT=%ERRORLEVEL%"

echo.
if not "%CODE_EXIT%"=="0" (
    echo [LOI] "npm run dev" dung voi ma loi %CODE_EXIT%.
    echo       Xem log phia tren de biet chi tiet.
    goto :fail
)

echo [OK] Frontend da dung binh thuong.
pause
exit /b 0

:fail
echo.
pause
exit /b 1

@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title HBDT - Backend (Spring Boot)

set "BE_DIR=Code\Server"

echo ============================================================
echo   HBDT - KHOI DONG BACKEND (Spring Boot - cong 8080)
echo ============================================================
echo.

if not exist "%BE_DIR%\mvnw.cmd" (
    echo [LOI] Khong tim thay: %BE_DIR%\mvnw.cmd
    echo       Hay chay file nay tu thu muc goc cua repo.
    goto :fail
)

where java >nul 2>nul
if errorlevel 1 (
    echo [LOI] Chua cai JDK. Can JDK 21 - tai tai https://adoptium.net
    goto :fail
)

cd /d "%BE_DIR%"

if exist ".env" goto :env_ok
echo [CANH BAO] Chua co %BE_DIR%\.env
if exist ".env.example" echo             Tao nhanh bang lenh: copy .env.example .env
echo             Sau do dien DB_HOST / DB_PORT / DB_NAME / DB_USERNAME / DB_PASSWORD.
echo.

:env_ok
echo [1/1] Dang chay "mvnw.cmd spring-boot:run" ...
echo.
echo   Backend      : http://localhost:8080/
echo   Health check : http://localhost:8080/actuator/health
echo.
echo   Lan dau chay Maven se tai dependency, co the mat vai phut.
echo   Nhan Ctrl+C de dung server.
echo ------------------------------------------------------------
echo.

call mvnw.cmd spring-boot:run
set "CODE_EXIT=%ERRORLEVEL%"

echo.
if not "%CODE_EXIT%"=="0" (
    echo [LOI] Backend dung voi ma loi %CODE_EXIT%.
    echo       Xem log phia tren de biet chi tiet.
    goto :fail
)

echo [OK] Backend da dung binh thuong.
pause
exit /b 0

:fail
echo.
pause
exit /b 1

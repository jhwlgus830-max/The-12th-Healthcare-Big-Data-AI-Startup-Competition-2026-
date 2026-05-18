@echo off
title 말랑해도 돼 - 통합 서버 실행기
echo ===================================================
echo   [말랑해도 돼] 프론트엔드 및 백엔드 서버를 시작합니다...
echo ===================================================
echo.

:: 1. 백엔드 서버 실행 (새로운 터미널 창)
echo [1/2] 파이썬 백엔드 서버(FastAPI)를 시작합니다...
start "말랑해도 돼 - FastAPI 백엔드" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --port 8000"

:: 2. 잠시 대기 (백엔드 준비 시간)
timeout /t 2 /nobreak > nul

:: 3. 프론트엔드 서버 실행 (새로운 터미널 창)
echo [2/2] 프론트엔드 서버(Next.js)를 시작합니다...
start "말랑해도 돼 - Next.js 프론트엔드" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ===================================================
echo   서버 실행 요청이 완료되었습니다!
echo   - 프론트엔드 접속 주소: http://localhost:3000
echo   - 백엔드 API 주소: http://localhost:8000
echo   (열린 터미널 창들을 닫으면 서버가 종료됩니다.)
echo ===================================================
echo.
pause

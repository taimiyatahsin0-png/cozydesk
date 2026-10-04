@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org & pause & exit /b 1)
if not exist node_modules (
  echo First run: installing CozyDesk, please wait 1-3 minutes...
  call npm.cmd install
  if errorlevel 1 (pause & exit /b 1)
)
call npm.cmd start
if errorlevel 1 pause

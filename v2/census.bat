@echo off
setlocal
cd /d "%~dp0"
title BB Scout - Census

:menu
cls
echo ============================================
echo             BB SCOUT  -  CENSUS
echo ============================================
echo.
echo   Scouts Slovenian U-21 candidates by calling
echo   them up to the NT roster, reading their skills,
echo   and dismissing them. Your rostered players are
echo   never touched.
echo.
echo   1.  Preview  (dry run - shows the plan, NO changes)
echo   2.  Run full census
echo   3.  Run a limited census (choose how many)
echo   4.  Resume a previous run
echo   5.  Re-scout everyone (even already-fresh players)
echo   6.  Quit
echo.
set /p choice="   Choose 1-6: "

if "%choice%"=="1" ( set ARGS=-- --dry-run& goto run )
if "%choice%"=="2" ( set ARGS=& goto confirm )
if "%choice%"=="3" ( goto limited )
if "%choice%"=="4" ( goto resume )
if "%choice%"=="5" ( set ARGS=-- --all& goto confirm )
if "%choice%"=="6" ( exit /b 0 )
goto menu

:limited
set /p n="   How many players to scout? "
set ARGS=-- --max %n%
goto confirm

:resume
set /p rid="   Run ID to resume: "
set ARGS=-- --resume %rid%
goto confirm

:confirm
echo.
echo   This will call up and dismiss players on your REAL
echo   BuzzerBeater U-21 roster. Keep your BB roster page
echo   open to watch the first batch if you like.
echo.
set /p ok="   Type Y to proceed: "
if /i not "%ok%"=="Y" goto menu

:run
echo.
echo   Running... (leave this window open until it finishes)
echo.
call npm run census %ARGS%
echo.
echo ============================================
echo   Done. Results are also on the Settings page:
echo   https://bb-scout-v2.vercel.app/settings
echo ============================================
echo.
pause
goto menu

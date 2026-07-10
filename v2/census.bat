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
echo   and dismissing them.
echo.
echo   OFF-SEASON ONLY: dismissing players drains NT
echo   enthusiasm, which is costly during the season.
echo.
echo   1.  Preview  (dry run - shows the plan, NO changes)
echo   2.  Run full census
echo   3.  Run a limited census (choose how many)
echo   4.  Run a FILTERED census (potential/salary/age/height)
echo   5.  Resume a previous run
echo   6.  Re-scout everyone (even already-fresh players)
echo   7.  Quit
echo.
set "choice="
set /p choice="   Choose 1-7: "

if "%choice%"=="1" ( set ARGS=-- --dry-run& goto run )
if "%choice%"=="2" ( set ARGS=--& goto confirm )
if "%choice%"=="3" ( goto limited )
if "%choice%"=="4" ( goto filtered )
if "%choice%"=="5" ( goto resume )
if "%choice%"=="6" ( set ARGS=-- --all& goto confirm )
if "%choice%"=="7" ( exit /b 0 )
goto menu

:limited
set "n="
set /p n="   How many players to scout? "
set ARGS=-- --max %n%
goto confirm

:filtered
echo.
echo   Leave any filter blank to skip it (no restriction applied).
echo.
rem  Each variable is cleared BEFORE its prompt: pressing Enter at a set /p
rem  prompt leaves the variable UNCHANGED (keeps a prior run's value), so
rem  without this a blank answer would silently reuse an earlier filter.
set "mp="
set /p mp="   Min potential (blank = any): "
set "ns="
set /p ns="   Min weekly salary (blank = any): "
set "xs="
set /p xs="   Max weekly salary (blank = any): "
set "mia="
set /p mia="   Min age (blank = 18): "
set "mxa="
set /p mxa="   Max age (blank = 21): "
set "mh="
set /p mh="   Min height cm (blank = any): "
set "xh="
set /p xh="   Max height cm (blank = any): "
set ARGS=--
if not "%mp%"=="" set ARGS=%ARGS% --min-potential %mp%
if not "%ns%"=="" set ARGS=%ARGS% --min-salary %ns%
if not "%xs%"=="" set ARGS=%ARGS% --max-salary %xs%
if not "%mia%"=="" set ARGS=%ARGS% --min-age %mia%
if not "%mxa%"=="" set ARGS=%ARGS% --max-age %mxa%
if not "%mh%"=="" set ARGS=%ARGS% --min-height %mh%
if not "%xh%"=="" set ARGS=%ARGS% --max-height %xh%
goto confirm

:resume
set "rid="
set /p rid="   Run ID to resume: "
set ARGS=-- --resume %rid%
goto confirm

:confirm
echo.
echo   ------------------------------------------------------------
echo    IMPORTANT - reads and MODIFIES your REAL U-21 roster.
echo    Each dismissal drains NT enthusiasm; heavy dismissals during
echo    the season can leave you unable to play. RUN OFF-SEASON ONLY.
echo    Keep your BB roster page open to watch if you like.
echo   ------------------------------------------------------------
echo.
echo   Args to run:  %ARGS%
echo.
echo   Checking how many candidates match...
call npm run census %ARGS% --count
echo.
set "clr="
set /p clr="   Auto-clear your own roster for full speed then restore it? (y/N): "
if /i "%clr%"=="Y" set ARGS=%ARGS% --clear-roster
echo.
echo   Final check: type  OFFSEASON  (all caps) to confirm it is safe
echo   to run right now. Anything else cancels.
echo.
set "ok="
set /p ok="   Confirm: "
if /i not "%ok%"=="OFFSEASON" ( echo.& echo   Not confirmed - returning to menu.& timeout /t 2 ^>nul & goto menu )
if "%ARGS%"=="" set ARGS=--
set ARGS=%ARGS% --confirm

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

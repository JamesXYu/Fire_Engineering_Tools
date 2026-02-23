@echo off
REM Fire Engineering Tools - Windows Control Script
REM Usage: run.bat [command]
REM Commands: start, persist, stop, restart, status, firewall, help

setlocal EnableDelayedExpansion

set PORT=4000
set SERVE_DIR=%~dp0FSE web
set FW_RULE_NAME=Fire Engineering Tools (Port %PORT%)

if "%1"=="" goto :usage
if /i "%1"=="start" goto :start
if /i "%1"=="persist" goto :persist
if /i "%1"=="stop" goto :stop
if /i "%1"=="restart" goto :restart
if /i "%1"=="status" goto :status
if /i "%1"=="firewall" goto :firewall
if /i "%1"=="help" goto :usage
if /i "%1"=="--help" goto :usage
if /i "%1"=="-h" goto :usage

echo [91mERROR: Unknown command: %1[0m
echo.
goto :usage

REM ============================================
REM Check if port is in use
REM ============================================
:is_port_used
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
exit /b

REM ============================================
REM Get PID on port
REM ============================================
:get_pid_on_port
set PID=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    set PID=%%a
    goto :pid_found
)
:pid_found
exit /b

REM ============================================
REM Get local IP
REM ============================================
:get_ip
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        if not defined LOCAL_IP set LOCAL_IP=%%b
    )
)
exit /b

REM ============================================
REM Print URLs
REM ============================================
:print_urls
call :get_ip
echo.
echo   Local:   http://localhost:%PORT%
if defined LOCAL_IP echo   Network: http://!LOCAL_IP!:%PORT%
echo.
echo   Other devices on the same Wi-Fi can
echo   access using the Network URL above.
exit /b

REM ============================================
REM Open firewall port
REM ============================================
:open_firewall
REM Check if rule already exists
netsh advfirewall firewall show rule name="%FW_RULE_NAME%" >nul 2>&1
if %errorlevel%==0 (
    echo   [92mFirewall rule already exists.[0m
    exit /b 0
)

echo   Opening firewall for port %PORT%...
netsh advfirewall firewall add rule name="%FW_RULE_NAME%" dir=in action=allow protocol=TCP localport=%PORT% >nul 2>&1
if %errorlevel%==0 (
    echo   [92mFirewall rule added successfully.[0m
    exit /b 0
) else (
    echo.
    echo   [91mFailed to add firewall rule.[0m
    echo   [93mThis requires Administrator privileges.[0m
    echo.
    echo   Please either:
    echo     1. Right-click run.bat and select "Run as administrator"
    echo     2. Or run: run.bat firewall   (as admin, one-time setup)
    echo     3. Or manually open port %PORT% in Windows Firewall
    echo.
    exit /b 1
)

REM ============================================
REM Firewall command (standalone)
REM ============================================
:firewall
echo =========================================
echo   Firewall Configuration
echo =========================================
echo.

REM Check current status
netsh advfirewall firewall show rule name="%FW_RULE_NAME%" >nul 2>&1
if %errorlevel%==0 (
    echo   Firewall rule already exists for port %PORT%.
    echo.
    echo   Current rule:
    netsh advfirewall firewall show rule name="%FW_RULE_NAME%" | findstr /c:"Rule Name" /c:"Enabled" /c:"Direction" /c:"Action" /c:"LocalPort"
    echo.
    echo   To remove it, run:
    echo     netsh advfirewall firewall delete rule name="%FW_RULE_NAME%"
) else (
    echo   No firewall rule found for port %PORT%.
    echo   Adding rule now...
    echo.
    call :open_firewall
)
echo.
echo =========================================
goto :eof

REM ============================================
REM Start (foreground, session-dependent)
REM ============================================
:start
echo =========================================
echo   Starting Fire Engineering Tools
echo =========================================

call :is_port_used
if %errorlevel%==0 (
    call :get_pid_on_port
    echo.
    echo   Server already running (PID: !PID!)
    call :print_urls
    echo =========================================
    goto :eof
)

call :open_firewall

call :print_urls
echo   Press Ctrl+C to stop the server.
echo =========================================
echo.

cd /d "%SERVE_DIR%"

where python3 >nul 2>&1
if %errorlevel%==0 (
    python3 -m http.server %PORT% --bind 0.0.0.0
) else (
    python -m http.server %PORT% --bind 0.0.0.0
)
goto :eof

REM ============================================
REM Persist (background, survives logout, auto-restart)
REM ============================================
:persist
echo =========================================
echo   Starting in Persistent Mode
echo =========================================
echo.
echo   Servers will keep running after you
echo   disconnect and auto-restart on crash.
echo.

call :is_port_used
if %errorlevel%==0 (
    call :get_pid_on_port
    echo   Server already running (PID: !PID!)
    call :print_urls
    echo   Logs: logs\server.log
    echo =========================================
    goto :eof
)

call :open_firewall
echo.

if not exist "logs" mkdir logs

REM Create the persistent wrapper batch file
> _server_persist.bat (
    echo @echo off
    echo :loop
    echo cd /d "%SERVE_DIR%"
    echo echo [%%date%% %%time%%] Server starting on port %PORT% ^>^> "%~dp0logs\server.log"
)

where python3 >nul 2>&1
if %errorlevel%==0 (
    >> _server_persist.bat echo python3 -m http.server %PORT% --bind 0.0.0.0 ^>^> "%~dp0logs\server.log" 2^>^&1
) else (
    >> _server_persist.bat echo python -m http.server %PORT% --bind 0.0.0.0 ^>^> "%~dp0logs\server.log" 2^>^&1
)

>> _server_persist.bat (
    echo echo [%%date%% %%time%%] Server exited, restarting in 3 seconds... ^>^> "%~dp0logs\server.log"
    echo timeout /t 3 /nobreak ^>nul
    echo goto loop
)

REM Launch in minimized window so it survives logout
start "FSE Server" /MIN cmd /c _server_persist.bat

timeout /t 2 /nobreak >nul

call :is_port_used
if %errorlevel%==0 (
    call :get_pid_on_port
    echo   Server started (PID: !PID!)
    call :print_urls
    echo.
    echo   Logs: logs\server.log
    echo.
    echo   To check: run.bat status
    echo   To stop:  run.bat stop
    echo.
    echo   You can safely disconnect now.
    echo =========================================
) else (
    echo   [91mERROR: Server failed to start.[0m
    echo   Check logs\server.log
    echo =========================================
)
goto :eof

REM ============================================
REM Stop
REM ============================================
:stop
echo =========================================
echo   Stopping Server
echo =========================================
echo.

call :is_port_used
if not %errorlevel%==0 (
    echo   Server is not running.
    echo =========================================
    goto :stop_wrapper
)

call :get_pid_on_port
if defined PID (
    taskkill /F /PID !PID! >nul 2>&1
    echo   Server stopped (PID: !PID!)
) else (
    echo   Server is not running.
)

:stop_wrapper
REM Stop persistent wrapper process if running
tasklist /FI "WINDOWTITLE eq FSE Server" 2>nul | find "cmd.exe" >nul
if %errorlevel%==0 (
    taskkill /F /FI "WINDOWTITLE eq FSE Server" >nul 2>&1
    echo   Persistent wrapper stopped.
)

if exist "_server_persist.bat" del "_server_persist.bat" >nul 2>&1

echo =========================================
goto :eof

REM ============================================
REM Restart
REM ============================================
:restart
echo =========================================
echo   Restarting Server
echo =========================================
echo.
call :stop
timeout /t 2 /nobreak >nul
if exist "logs\server.log" (
    goto :persist
) else (
    goto :start
)

REM ============================================
REM Status
REM ============================================
:status
echo =========================================
echo   Server Status
echo =========================================
echo.

call :is_port_used
if %errorlevel%==0 (
    call :get_pid_on_port
    echo   Status: [92mRUNNING[0m (PID: !PID!)
    call :print_urls

    tasklist /FI "WINDOWTITLE eq FSE Server" 2>nul | find "cmd.exe" >nul
    if %errorlevel%==0 (
        echo   Mode: Persistent
        echo   Log:  logs\server.log
    ) else (
        echo   Mode: Foreground
    )
) else (
    echo   Status: [91mSTOPPED[0m
)

echo.
echo   Firewall:
netsh advfirewall firewall show rule name="%FW_RULE_NAME%" >nul 2>&1
if %errorlevel%==0 (
    echo   [92mPort %PORT% is open[0m
) else (
    echo   [91mPort %PORT% is NOT open - run: run.bat firewall[0m
)

echo.
echo =========================================
goto :eof

REM ============================================
REM Usage
REM ============================================
:usage
echo Fire Engineering Tools - Control Script
echo.
echo Usage: run.bat [command]
echo.
echo Commands:
echo   start      Start server (foreground, stops when you disconnect)
echo   persist    Start in persistent mode (survives disconnects, auto-restart)
echo   stop       Stop the server
echo   restart    Restart the server
echo   status     Check if server is running
echo   firewall   Open port %PORT% in Windows Firewall (run as admin)
echo   help       Show this help message
echo.
echo Examples:
echo   run.bat firewall   # First time: open port (run as admin)
echo   run.bat persist    # For company servers (RECOMMENDED)
echo   run.bat start      # For local testing
echo   run.bat status     # Check what's running
echo   run.bat stop       # Stop everything
echo.
echo IMPORTANT: On Windows Server, you must run 'run.bat firewall' once as
echo Administrator to allow network access. Or right-click run.bat and
echo select "Run as administrator" the first time you use start/persist.
echo.
goto :eof

@echo off
setlocal

rem Windows Task Scheduler should run this file at 09:40, 12:40, and 15:10.
rem Change 127.0.0.1 if the Next.js application runs on another computer.
set "SYNC_URL=http://127.0.0.1:3008/api/import-jobs/sync-shared-drive?trigger=true&key=psc_sync_secret"

for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"
set "LOG_FILE=%PROJECT_DIR%\sync-shared-drive.log"

echo.>> "%LOG_FILE%"
echo [%DATE% %TIME%] Starting shared-drive sync...>> "%LOG_FILE%"

where curl.exe >nul 2>&1
if errorlevel 1 goto use_powershell

curl.exe --silent --show-error --fail-with-body ^
    --connect-timeout 15 ^
    --max-time 1800 ^
    --retry 2 ^
    --retry-delay 30 ^
    --header "Accept: application/json" ^
    "%SYNC_URL%" >> "%LOG_FILE%" 2>&1

set "EXIT_CODE=%ERRORLEVEL%"
goto sync_result

:use_powershell
echo [%DATE% %TIME%] curl.exe not found; using Windows PowerShell.>> "%LOG_FILE%"

"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass ^
    -Command "$ProgressPreference = 'SilentlyContinue'; try { $response = Invoke-WebRequest -UseBasicParsing -Uri '%SYNC_URL%' -TimeoutSec 1800 -Headers @{ Accept = 'application/json' } -ErrorAction Stop; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $response.Content; exit 0 } catch { [Console]::Error.WriteLine($_.Exception.Message); if ($_.ErrorDetails.Message) { [Console]::Error.WriteLine($_.ErrorDetails.Message) }; exit 1 }" ^
    >> "%LOG_FILE%" 2>&1

set "EXIT_CODE=%ERRORLEVEL%"

:sync_result
if not "%EXIT_CODE%"=="0" goto sync_failed

echo.>> "%LOG_FILE%"
echo [%DATE% %TIME%] Sync completed successfully.>> "%LOG_FILE%"
exit /b 0

:sync_failed
echo.>> "%LOG_FILE%"
echo [%DATE% %TIME%] Sync failed. Exit code: %EXIT_CODE%>> "%LOG_FILE%"
exit /b %EXIT_CODE%

@echo off
title DUBAI PIZZA SHOP POS - Windows Launcher
color 0E
echo ======================================================================
echo                 DUBAI PIZZA SHOP - OFFLINE DESKTOP POS
echo                    Sian, Jhal - 0342-2562389
echo ======================================================================
echo.
echo Launching Dubai Pizza Shop POS Desktop Server...
echo Checking local runtime environment...
echo.

if exist "DubaiPizzaShopPOS_Setup.exe" (
  echo Launching Windows Native Application...
  start "" "DubaiPizzaShopPOS_Setup.exe"
  exit
)

echo Starting local POS web server on port 3000...
start "" "http://localhost:3000"
npm run dev

pause

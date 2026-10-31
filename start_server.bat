@echo off
chcp 65001 >nul
title SDragon AssetTracker Pro - Khoi Chay Web Quan Ly Tai San May Moc
echo ======================================================================
echo    SDRAGON ASSETTRACKER PRO - HỆ THỐNG QUẢN LÝ TÀI SẢN MÁY MÓC
echo ======================================================================
echo Đang mở ứng dụng trên trình duyệt web của bạn...
echo.

:: Open index.html directly in default browser
start "" "%~dp0index.html"

echo Ứng dụng đã sẵn sàng! Bạn có thể thu nhỏ cửa sổ này.
echo Để lưu trữ hoặc in tem QR, sử dụng các nút chức năng trên giao diện.
pause

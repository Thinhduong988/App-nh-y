@echo off
chcp 65001 >nul
title [TEST NHANH] Free Fire AI Sensitivity Pro - May Ao Android
color 0A

echo ===================================================================
echo    🎮 TRÌNH KHỞI ĐỘNG MÔI TRƯỜNG TEST ANDROID (PIXEL 10 PRO)
echo ===================================================================
echo.

set ANDROID_HOME=D:\User
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%

echo [1/4] Đang kiểm tra thiết bị Android...
adb devices | findstr /i "emulator device" >nul
if %errorlevel% neq 0 (
    echo [!] Máy ảo chưa bật, đang tự động khởi động Pixel_10_Pro...
    start "" "%ANDROID_HOME%\emulator\emulator.exe" -avd Pixel_10_Pro
    echo [i] Vui lòng chờ máy ảo khởi động xong (khoảng 30 giây)...
    adb wait-for-device
    echo [i] Đang đợi Android boot hoàn tất...
    :wait_boot
    timeout /t 2 >nul
    for /f "tokens=*" %%a in ('adb shell getprop sys.boot_completed 2^>nul') do set BOOT_STATE=%%a
    if not "%BOOT_STATE%"=="1" goto wait_boot
    echo [✓] Máy ảo đã sẵn sàng!
) else (
    echo [✓] Đã phát hiện máy ảo hoặc thiết bị Android đang chạy!
)

echo.
echo [2/4] Đang cài đặt file APK mới nhất vào máy ảo...
if exist "D:\ff-sensitivity-app\Do_Nhay_Free_Fire_AI_Pro_v1.0.6.apk" (
    adb install -r "D:\ff-sensitivity-app\Do_Nhay_Free_Fire_AI_Pro_v1.0.6.apk"
) else (
    adb install -r "D:\ff-sensitivity-app\android\app\build\outputs\apk\release\app-release.apk"
)

echo.
echo [3/4] Cấp quyền Nút Nổi Phủ Màn Hình (Draw Over Other Apps)...
adb shell appops set com.ffpro.sensitivity SYSTEM_ALERT_WINDOW allow

echo.
echo [4/4] Khởi động ứng dụng trên máy ảo...
adb shell monkey -p com.ffpro.sensitivity -c android.intent.category.LAUNCHER 1 >nul 2>&1

echo.
echo ===================================================================
echo  ✅ ỨNG DỤNG ĐÃ ĐƯỢC MỞ TRÊN MÁY ẢO THÀNH CÔNG!
echo  👉 Bạn có thể test trực tiếp các tính năng:
echo     - Đồng bộ Cloud OTA
echo     - Nút nổi GG Game Space & các phím bên cạnh
echo     - Trình phát nhạc chiến game & Wiki Free Fire
echo ===================================================================
echo.
pause

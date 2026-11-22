@echo off
chcp 65001 >nul
title [BUILD & TEST] Biên Dịch Code & Chạy Test Ngay Trên Máy Ảo
color 0E

echo ===================================================================
echo    🛠️ BIÊN DỊCH CODE MỚI NHẤT & CÀI LÊN MÁY ẢO ANDROID
echo ===================================================================
echo.

set JAVA_HOME=D:\JDK17
set ANDROID_HOME=D:\User
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%

echo [1/3] Đang biên dịch code sang file APK Release bằng Gradle...
cd /d "D:\ff-sensitivity-app\android"
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo.
    echo ❌ Biên dịch thất bại! Vui lòng kiểm tra lại mã nguồn.
    pause
    exit /b 1
)

echo.
echo [2/3] Cập nhật file APK ra thư mục gốc...
copy /y "D:\ff-sensitivity-app\android\app\build\outputs\apk\release\app-release.apk" "D:\ff-sensitivity-app\Do_Nhay_Free_Fire_AI_Pro_v1.0.7.apk" >nul

echo.
echo [3/3] Đẩy bản cài đặt vào máy ảo và mở app...
cd /d "D:\ff-sensitivity-app"
call "CHAY_TEST_MAY_AO.bat"

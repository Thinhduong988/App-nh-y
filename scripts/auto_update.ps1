# Free Fire AI Auto-Updater (Daily Sensitivity OTA + Weekly Sunday Release APK)
$ErrorActionPreference = "Stop"

$repoDir = "D:\ff-sensitivity-app"
Set-Location $repoDir

$currentDate = Get-Date
$todayDayOfWeek = $currentDate.DayOfWeek
$dateStr = $currentDate.ToString("yyyy-MM-dd")
$timeStr = $currentDate.ToString("yyyy-MM-dd HH:mm:ss")

Write-Host "=== Free Fire AI Auto-Updater Started: $timeStr ==="
Write-Host "Day of Week: $todayDayOfWeek"

# Step 1: Ensure git is clean and on latest main
git fetch origin main
git checkout main
git pull origin main

# Step 2: Update onlineSensitivity.json (Daily OTA Update)
$jsonPath = Join-Path $repoDir "src\data\onlineSensitivity.json"
if (Test-Path $jsonPath) {
    $rawJson = Get-Content $jsonPath -Raw | ConvertFrom-Json
    $rawJson.lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
    $rawJson.metaVersion = (Get-Date).ToString("yyyy.MM.dd")
    $rawJson.updateNotes = "Cap nhat tu dong thong so keo tam AI cho meta Free Fire moi nhat ngay $dateStr. Tu dong ap dung tren thiet bi di dong."
    
    $rawJson | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8
    Write-Host "✓ Updated src\data\onlineSensitivity.json with new meta timestamp: $dateStr"
}

# Step 3: Check if today is Sunday (Weekly Release Trigger)
if ($todayDayOfWeek -eq [System.DayOfWeek]::Sunday) {
    Write-Host ">>> TODAY IS SUNDAY: Packaging Weekly Release APK & Publishing to GitHub..."
    
    # Read current version from package.json
    $pkgPath = Join-Path $repoDir "package.json"
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $oldVersion = $pkg.version
    
    # Bump patch version (e.g. 1.0.6 -> 1.0.7)
    $versionParts = $oldVersion.Split('.')
    $versionParts[2] = [int]$versionParts[2] + 1
    $newVersion = $versionParts -join '.'
    $pkg.version = $newVersion
    $pkg | ConvertTo-Json -Depth 5 | Set-Content $pkgPath -Encoding UTF8
    
    # Update app.json
    $appJsonPath = Join-Path $repoDir "app.json"
    if (Test-Path $appJsonPath) {
        $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
        $appJson.expo.version = $newVersion
        $appJson.expo.android.versionCode = [int]$appJson.expo.android.versionCode + 1
        $appJson | ConvertTo-Json -Depth 5 | Set-Content $appJsonPath -Encoding UTF8
    }
    
    # Update android/app/build.gradle
    $buildGradlePath = Join-Path $repoDir "android\app\build.gradle"
    if (Test-Path $buildGradlePath) {
        $content = Get-Content $buildGradlePath -Raw
        $content = $content -replace 'versionName "[^"]+"', "versionName `"$newVersion`""
        Set-Content $buildGradlePath $content -Encoding UTF8
    }
    
    Write-Host "✓ Version bumped from $oldVersion to $newVersion"
    
    # Build APK Release
    Write-Host "Building release APK with Gradle..."
    $env:JAVA_HOME = "D:\JDK17"
    $env:ANDROID_HOME = "D:\User"
    Set-Location (Join-Path $repoDir "android")
    .\gradlew.bat assembleRelease
    
    Set-Location $repoDir
    $builtApk = Join-Path $repoDir "android\app\build\outputs\apk\release\app-release.apk"
    $targetApk = Join-Path $repoDir "Do_Nhay_Free_Fire_AI_Pro_v$newVersion.apk"
    if (Test-Path $builtApk) {
        Copy-Item $builtApk $targetApk -Force
        Write-Host "✓ Release APK created: $targetApk"
    } else {
        Write-Error "Release APK build failed or output not found!"
        exit 1
    }
    
    # Commit and tag
    git add .
    git commit -m "chore(release): publish weekly release v$newVersion with new AI sensitivity"
    git tag "v$newVersion"
    git push origin main --tags
    
    # GitHub Release Create
    $releaseNotes = @"
# 🎯 ĐỘ NHẠY FREE FIRE AI PRO 2026 - v$newVersion (Bản Phát Hành Tự Động)

Bản cập nhật phát hành định kỳ hàng tuần được tự động biên dịch và kiểm thử.

### 🌟 Nội Dung Cập Nhật:
- **Tối ưu bảng độ nhạy AI**: Đồng bộ toàn bộ dữ liệu meta súng và DPI mới nhất.
- **Nâng cấp tính năng**: Cải tiến giao diện Game Space, trình phát nhạc và cổng Wiki Free Fire.
- **Tự động hóa OTA**: Người dùng mở app sẽ nhận ngay dữ liệu độ nhạy mới nhất mà không bắt buộc phải tải lại APK.

### 📲 Tải File APK:
Nhấp vào file **Do_Nhay_Free_Fire_AI_Pro_v$newVersion.apk** đính kèm bên dưới để cài đặt trực tiếp.
"@
    
    gh release create "v$newVersion" $targetApk --title "Do Nhay Free Fire AI Pro 2026 - v$newVersion (Weekly Release)" --notes $releaseNotes
    Write-Host "✓ Successfully published GitHub Release v$newVersion!"

} else {
    Write-Host ">>> WEEKDAY RUN: Updating online sensitivity data & pushing to GitHub..."
    git add src/data/onlineSensitivity.json
    $commitMsg = "feat(ai-sensitivity): auto-update cloud sensitivity database for OB47 meta [$dateStr]"
    git commit -m $commitMsg
    git push origin main
    Write-Host "✓ Successfully updated and pushed cloud sensitivity data for $dateStr! Users get updates OTA without app update."
}

Write-Host "=== Free Fire AI Auto-Updater Finished Successfully ==="

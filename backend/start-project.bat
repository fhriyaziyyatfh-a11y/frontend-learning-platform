@echo off
chcp 65001
cls
echo MongoDB Başladılır...

:: Məlumat qovluğunu yarat (əgər yoxdursa)
if not exist "C:\Users\Administrator\Desktop\Новая папка\mongodb-data" mkdir "C:\Users\Administrator\Desktop\Новая папка\mongodb-data"

:: Əvvəlcə 8.0 versiyasını yoxla, yoxdursa 7.0-ı yoxla
if exist "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" (
    set MONGO_PATH="C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
) else if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    set MONGO_PATH="C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
) else (
    echo [XƏTA] MongoDB tapılmadı! Zəhmət olmasa C:\Program Files\MongoDB\Server qovluğunu yoxlayın.
    pause
    exit
)

echo Tapılan yol: %MONGO_PATH%
%MONGO_PATH% --dbpath "C:\Users\Administrator\Desktop\Новая папка\mongodb-data"

pause
@echo off
echo Iniciando MediFlow...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
timeout /t 30
cd /d C:\Users\Sistemas\Mediflow
docker compose up -d
echo MediFlow iniciado correctamente

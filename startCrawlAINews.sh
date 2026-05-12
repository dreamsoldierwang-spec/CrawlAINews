#!/bin/bash
echo "=== 启动小帅 AI 日报 ==="
cd /Users/dreamsoldier/TraeProject/v2026-4-27_CrawlAINews
echo "[1/3] 启动 Docker..."
docker compose up -d
echo "[2/3] 启动后端服务..."
cd backend
npm run dev &
echo "[3/3] 启动微信开发者工具..."
open -a "微信开发者工具"
echo "=== 启动完成 ==="

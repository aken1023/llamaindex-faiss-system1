# 企業知識庫系統 Docker 配置
FROM python:3.10-slim

WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY scripts/requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用代碼
COPY scripts/ ./scripts/
COPY documents/ ./documents/
COPY .env ./.env

# 創建必要目錄
RUN mkdir -p faiss_index logs

# 暴露端口
EXPOSE 8000

# 運行前台服務器
CMD ["python", "scripts/api_server.py"]

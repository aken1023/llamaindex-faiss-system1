#!/usr/bin/env python3
"""
Zeabur專用API啟動腳本
添加更好的環境變數處理和錯誤處理
"""

import os
import sys
import logging
from pathlib import Path
import traceback

# 設置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("zeabur-api")

def main():
    try:
        # 創建必要目錄
        logger.info("正在創建必要目錄...")
        os.makedirs("documents", exist_ok=True)
        os.makedirs("faiss_index", exist_ok=True)
        os.makedirs("logs", exist_ok=True)
        
        # 打印環境信息
        logger.info(f"當前工作目錄: {os.getcwd()}")
        logger.info(f"Python版本: {sys.version}")
        logger.info(f"環境變數: PORT={os.environ.get('PORT', 'not set')}")
        
        # 優先使用Zeabur提供的端口
        port = int(os.environ.get('PORT', 8000))
        logger.info(f"使用端口: {port}")
        
        # 檢查必要的環境變數
        if not os.environ.get('DEEPSEEK_API_KEY'):
            logger.warning("警告: 未設置DEEPSEEK_API_KEY環境變數")
        
        # 檢查是否有JWT密鑰(多用戶模式需要)
        if os.path.exists("scripts/api_server_multi.py") and not os.environ.get('JWT_SECRET_KEY'):
            logger.warning("警告: 多用戶模式需要JWT_SECRET_KEY環境變數")
            # 為了避免啟動失敗，設置一個默認值
            os.environ['JWT_SECRET_KEY'] = 'zeabur-default-jwt-secret-key'
        
        # 決定使用哪個API服務器
        if os.path.exists("scripts/api_server_multi.py") and os.environ.get('USE_MULTI_USER', '').lower() == 'true':
            # 多用戶模式
            logger.info("啟動多用戶API服務器...")
            from scripts.api_server_multi import app
            import uvicorn
            uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
        else:
            # 單用戶模式
            logger.info("啟動單用戶API服務器...")
            from scripts.api_server import app
            import uvicorn
            uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
            
    except Exception as e:
        logger.error(f"啟動失敗: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    logger.info("Zeabur API服務啟動中...")
    main() 
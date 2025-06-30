# 🚀 Zeabur 部署方式對比指南

## 📋 兩種部署方式

### 🐳 Docker 部署 vs 🐍 原生 Python 部署

| 特性 | Docker 部署 | 原生 Python 部署 |
|------|-------------|------------------|
| **配置文件** | `Dockerfile` | `zeabur.toml` |
| **環境隔離** | ⭐⭐⭐⭐⭐ 完全隔離 | ⭐⭐⭐ 平台環境 |
| **依賴控制** | ⭐⭐⭐⭐⭐ 完全控制 | ⭐⭐⭐ 依賴 Zeabur |
| **構建速度** | ⭐⭐ 較慢 | ⭐⭐⭐⭐ 快速 |
| **資源使用** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 輕量 |
| **可移植性** | ⭐⭐⭐⭐⭐ 任何平台 | ⭐⭐ 限 Zeabur |
| **調試難度** | ⭐⭐ 較困難 | ⭐⭐⭐⭐ 容易 |
| **部署穩定性** | ⭐⭐⭐⭐ 穩定 | ⭐⭐⭐ 中等 |

## 🔄 當前設置 - 使用 zeabur.toml

你現在的配置將使用**原生 Python 部署**，因為：

1. ✅ 創建了 `zeabur.toml` 配置文件
2. ✅ 創建了 `.zeaburignore` 忽略 Docker 文件
3. ✅ Zeabur 會優先檢測 `zeabur.toml`

## 📊 zeabur.toml 配置說明

### 🏗️ 構建配置
```toml
[build]
type = "python"                        # Python 原生環境
python_version = "3.11"                # Python 版本
requirements = [                       # 依賴文件優先順序
    "scripts/requirements-minimal.txt", # 1. 最小化依賴（推薦）
    "scripts/requirements-zeabur.txt",  # 2. 完整依賴
    "scripts/requirements.txt"          # 3. 最後備用
]
```

### 🚀 運行配置
```toml
[run]
start_command = "python scripts/main.py"  # 啟動命令
working_directory = "."                   # 工作目錄
port = 8000                              # 端口
```

### 💾 存儲配置
```toml
[storage]
user_documents = { path = "user_documents", size = "5GB" }
user_indexes = { path = "user_indexes", size = "2GB" }
database = { path = "knowledge_base.db", size = "1GB" }
```

## 🎯 部署步驟

### 1. 推送 zeabur.toml 配置

```bash
git add .
git commit -m "添加 zeabur.toml 原生 Python 部署配置"
git push
```

### 2. Zeabur 自動重新部署

Zeabur 會檢測到 `zeabur.toml` 並使用原生 Python 部署：

```
🔍 檢測到 zeabur.toml
🐍 使用 Python 3.11 環境
📦 安裝依賴: scripts/requirements-minimal.txt
🚀 啟動命令: python scripts/main.py
✅ 部署成功
```

### 3. 查看部署日誌

在 Zeabur 控制面板中應該看到：

```
=== Zeabur 原生 Python 部署 ===
📂 當前目錄: /opt/zeabur/src
🐍 Python 版本: Python 3.11.x
📦 安裝依賴...
✅ 依賴安裝完成
🚀 LlamaIndex FAISS 知識庫系統 - Zeabur 部署
✓ 使用認證版 API 服務器: auth_api_server.py
✓ 服務器地址: 0.0.0.0:8000
```

## ⚡ 優勢分析

### 🐍 原生 Python 部署優勢

1. **更快的構建時間**
   - 無需構建 Docker 映像
   - 直接使用 Zeabur Python 環境
   - 增量依賴安裝

2. **更輕量的資源使用**
   - 無 Docker 開銷
   - 更低的記憶體占用
   - 更快的冷啟動

3. **更簡單的調試**
   - 直接訪問應用日誌
   - 更清晰的錯誤信息
   - 即時重啟

4. **自動優化**
   - Zeabur 平台優化
   - 自動依賴緩存
   - 智能擴展

## ⚠️ 注意事項

### 環境限制
- 依賴 Zeabur 的 Python 環境
- 某些系統級依賴可能不可用
- 無法自定義作業系統

### 依賴處理
原生部署會依序嘗試：
1. `scripts/requirements-minimal.txt` ← **推薦**
2. `scripts/requirements-zeabur.txt`
3. `scripts/requirements.txt`

### 持久化存儲
配置了自動掛載：
- 用戶文檔：5GB
- 索引文件：2GB  
- 數據庫：1GB

## 🔄 如何切換回 Docker 部署

如果需要切換回 Docker：

1. **刪除或重命名文件**：
```bash
mv zeabur.toml zeabur.toml.backup
mv .zeaburignore .zeaburignore.backup
```

2. **推送更改**：
```bash
git add .
git commit -m "切換回 Docker 部署"
git push
```

3. **Zeabur 會自動檢測 Dockerfile**

## 🎯 推薦選擇

### 選擇原生部署，如果：
- ✅ 追求快速部署
- ✅ 希望輕量資源使用
- ✅ 需要簡單調試
- ✅ 依賴相對簡單

### 選擇 Docker 部署，如果：
- ✅ 需要完全環境控制
- ✅ 有複雜系統依賴
- ✅ 要求最大可移植性
- ✅ 對穩定性要求極高

## 🚀 測試部署

部署完成後測試：

```bash
# 健康檢查
curl https://your-app.zeabur.app/health

# 預期響應
{
    "status": "healthy",
    "timestamp": "2024-...",
    "deployment": "zeabur-native-python"
}
```

---

**當前設置：** 🐍 原生 Python 部署 (zeabur.toml)  
**備用方案：** 🐳 Docker 部署 (Dockerfile)  
**推薦：** 先試試原生部署，遇到問題再切換 Docker 
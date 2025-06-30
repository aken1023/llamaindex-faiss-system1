# 🔧 Zeabur 依賴衝突修復指南

## 🚨 問題描述

Zeabur Docker 構建失敗，錯誤信息：
```
ERROR: ResolutionImpossible: for help visit https://pip.pypa.io/en/latest/topics/dependency-resolution/#dealing-with-dependency-conflicts
```

## 🔍 根本原因

1. **固定版本衝突**：`requirements-zeabur.txt` 使用了固定版本（`==`），導致依賴無法解析
2. **過時的版本**：LlamaIndex 0.9.0 與其他現代依賴不兼容
3. **不必要的依賴**：包含了 `pathlib2` 等 Python 3.8+ 不需要的包

## ✅ 修復內容

### 1. 更新 `requirements-zeabur.txt`

**主要改變：**
- ❌ `llama-index==0.9.0` → ✅ `llama-index>=0.10.0,<0.13.0`
- ❌ `fastapi==0.95.2` → ✅ `fastapi>=0.100.0,<0.110.0`
- ❌ 固定版本 (`==`) → ✅ 相容範圍 (`>=,<`)
- ❌ `pathlib2==2.3.7` → ✅ 移除（不需要）

**版本策略：**
- 使用範圍版本而非固定版本
- 確保主要依賴相互兼容
- 避免使用 beta 或預覽版本

### 2. 創建 `requirements-minimal.txt`

**最小化依賴集合：**
- 只包含運行時必需的核心依賴
- 移除可選的 ML 功能（sentence-transformers, torch）
- 作為主要依賴安裝失敗時的後備方案

### 3. 優化 Dockerfile

**改進構建過程：**
- 升級 pip、setuptools、wheel
- 雙重後備策略：先嘗試完整依賴，失敗則使用最小化依賴
- 更好的錯誤處理和日誌

## 🚀 部署步驟

### 1. 推送修復代碼

```bash
git add .
git commit -m "修復 Zeabur 依賴衝突：更新版本範圍和後備方案"
git push
```

### 2. 監控 Zeabur 重新部署

在 Zeabur 控制面板中查看構建日誌：

**成功日誌應顯示：**
```
Step 6/12 : RUN pip install --no-cache-dir -r requirements-zeabur.txt
✅ Successfully installed llama-index-0.10.x fastapi-0.100.x ...
```

**如果使用後備方案：**
```
主要依賴安裝失敗，嘗試最小化依賴...
✅ Successfully installed minimal dependencies
```

### 3. 測試 API 功能

部署成功後測試核心功能：

```bash
# 健康檢查
curl https://your-app.zeabur.app/health

# 認證測試
curl -X POST https://your-app.zeabur.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'
```

## 🔄 如果問題持續

### 選項 1：使用純最小化依賴

修改 Dockerfile，直接使用最小化依賴：

```dockerfile
# 替換這行：
COPY scripts/requirements-zeabur.txt ./requirements-zeabur.txt
# 為：
COPY scripts/requirements-minimal.txt ./requirements.txt

# 然後：
RUN pip install --no-cache-dir -r requirements.txt
```

### 選項 2：分步安裝依賴

創建分層安裝策略：

```dockerfile
# 先安裝基礎依賴
RUN pip install fastapi uvicorn sqlalchemy
# 再安裝 AI 相關依賴
RUN pip install llama-index faiss-cpu
# 最後安裝其他工具
RUN pip install requests loguru python-dotenv
```

### 選項 3：使用預構建映像

考慮使用包含機器學習依賴的基礎映像：

```dockerfile
FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime
# 或
FROM huggingface/transformers-pytorch-cpu:latest
```

## 📊 依賴對比

| 組件 | 舊版本 | 新版本 | 狀態 |
|------|--------|--------|------|
| LlamaIndex | 0.9.0 | >=0.10.0,<0.13.0 | ✅ 修復 |
| FastAPI | 0.95.2 | >=0.100.0,<0.110.0 | ✅ 更新 |
| PyTorch | 1.13.1 | 可選安裝 | ⚠️ 按需 |
| pathlib2 | 2.3.7 | 移除 | ✅ 清理 |

## 🎯 預期結果

修復後應該看到：
- ✅ Docker 構建成功
- ✅ 所有 API 端點正常工作
- ✅ 用戶認證功能完整
- ✅ 文檔上傳和查詢功能正常
- ⚠️ AI 模型功能可能需要額外配置（如果使用最小化依賴）

## 🔧 故障排除

如果仍有問題：

1. **檢查 Python 版本**：確保使用 Python 3.11
2. **檢查記憶體限制**：某些依賴需要較多記憶體編譯
3. **檢查網絡連接**：確保能訪問 PyPI
4. **查看完整日誌**：在 Zeabur 控制面板查看詳細錯誤信息

---

**注意：** 使用最小化依賴可能會影響部分 AI 功能，但核心知識庫和認證功能會正常工作。 
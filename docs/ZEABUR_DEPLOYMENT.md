# Zeabur 部署指南

本文檔提供了將企業知識庫系統部署到 Zeabur 平台的詳細指南。

## 部署前準備

### 1. Zeabur 帳號

確保您已經在 [Zeabur](https://zeabur.com) 註冊並創建了帳號。

### 2. 項目結構確認

確保您的項目結構如下：

```
- app/                   # Next.js 前端應用
- components/            # 前端組件
- scripts/               # API 伺服器和設置腳本
  - api_server.py        # FastAPI 服務
  - setup_knowledge_base.py  # 知識庫系統核心
  - requirements.txt     # Python 依賴
- documents/             # 知識庫文檔存放處
- faiss_index/           # FAISS 向量索引存放處
- zeabur.toml            # Zeabur 配置文件
```

### 3. 環境變數

確保在 Zeabur 的專案設定中添加以下環境變數：

- `DEEPSEEK_API_KEY`: DeepSeek API 密鑰
- `EMBEDDING_MODEL`: 默認為 `BAAI/bge-base-zh`
- `MODEL_NAME`: 默認為 `deepseek-chat`

## 部署步驟

### 1. 推送代碼到 Git 倉庫

確保您的專案代碼已推送到 GitHub、GitLab 或其他 Git 平台。

### 2. 在 Zeabur 中創建新專案

1. 登入 Zeabur 控制台
2. 點擊「建立專案」按鈕
3. 輸入專案名稱（例如：`enterprise-knowledge-base`）

### 3. 添加服務

Zeabur 會自動檢測到 `zeabur.toml` 文件並配置服務。

### 4. 配置環境變數

在 Zeabur 控制台中：

1. 進入您的專案
2. 點擊「環境變數」頁籤
3. 添加所需的環境變數（參考上方第 3 點）

### 5. 配置網域

1. 在服務頁面中，點擊「網域」頁籤
2. 設置您的自定義網域或使用 Zeabur 提供的默認子網域

### 6. 設置持久化儲存

確保在 Zeabur 中為以下目錄配置了持久化儲存：

- `/app/documents`: 用於存儲知識庫文檔
- `/app/faiss_index`: 用於存儲向量索引
- `/app/logs`: 用於存儲系統日誌

這些配置已經在 `zeabur.toml` 文件中定義。

## 部署後檢查

部署完成後，您可以訪問以下端點檢查系統運行狀態：

- 前端應用：`https://您的網域/`
- API 文檔：`https://您的網域/api/docs`
- 系統狀態：`https://您的網域/api/status`

## 常見問題排解

### API 服務無法啟動

檢查環境變數是否正確設置，特別是 `DEEPSEEK_API_KEY`。

### 索引建立失敗

檢查 `/app/documents` 目錄是否已正確掛載並包含文檔文件。

### 前後端連接問題

確保前端應用中的 API 基礎 URL 配置正確指向後端服務。

## 更新部署

當您需要更新應用時，只需將更新後的代碼推送到 Git 倉庫，Zeabur 將自動重新部署您的應用。 
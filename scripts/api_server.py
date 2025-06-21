"""
FastAPI 服務器 - 提供 REST API 接口
"""

import shutil
import time
import uuid
from pathlib import Path

import edge_tts
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional

# 載入環境變數
load_dotenv()

# 導入知識庫系統
from setup_knowledge_base import KnowledgeBaseSystem


app = FastAPI(title="企業知識庫 API", version="1.0.0")

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 請求/響應模型
class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


class QueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[dict]
    processing_time: float


class SystemStatus(BaseModel):
    status: str
    documents_count: int
    index_size: int
    model_status: str


class TextToSpeechRequest(BaseModel):
    text: str
    voice: str = "zh-TW-HsiaoChenNeural"  # 默認使用台灣女聲
    rate: str = "+0%"                     # 語速，默認正常
    volume: str = "+0%"                   # 音量，默認正常


# 全局知識庫實例
kb_system = KnowledgeBaseSystem()

# 確保音頻文件目錄存在
AUDIO_DIR = Path("audio_files")
AUDIO_DIR.mkdir(exist_ok=True)


@app.on_event("startup")
async def startup_event():
    """應用啟動時初始化"""
    print("正在初始化知識庫系統...")
    kb_system.load_documents()
    if not kb_system.load_index():
        kb_system.build_index()
    print("知識庫系統初始化完成")


@app.get("/")
async def root():
    return {"message": "企業知識庫 API 服務運行中"}


@app.post("/upload", response_model=dict)
async def upload_document(file: UploadFile = File(...)):
    """上傳文檔"""
    try:
        # 保存上傳的文件
        upload_dir = Path("documents")
        upload_dir.mkdir(exist_ok=True)
        
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 重新建立索引
        kb_system.load_documents()
        kb_system.build_index()
        
        return {
            "message": f"文檔 {file.filename} 上傳成功",
            "filename": file.filename,
            "size": file_path.stat().st_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上傳失敗: {str(e)}")


@app.post("/query", response_model=dict)
async def query_knowledge_base(request: QueryRequest):
    """查詢知識庫"""
    try:
        start_time = time.time()
        
        # 執行實際查詢
        search_results = kb_system.search(request.query, request.top_k)
        
        # 提取最相關的上下文文檔
        context_docs = [result['content'] for result in search_results[:2]]
        
        # 使用 LLM 生成回答
        answer = kb_system.query_with_llm(request.query, context_docs)
        
        processing_time = time.time() - start_time
        
        return {
            "query": request.query,
            "answer": answer,
            "sources": search_results,
            "processing_time": processing_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查詢失敗: {str(e)}")


@app.get("/status", response_model=dict)
async def get_system_status():
    """獲取系統狀態"""
    return {
        "status": "running",
        "documents_count": len(kb_system.documents),
        "index_size": kb_system.faiss_index.ntotal if kb_system.faiss_index else 0,
        "model_status": "ready",
        "memory_usage": "2.1GB",  # 這個可以改為實際測量
        "cpu_usage": "45%"        # 這個可以改為實際測量
    }


@app.get("/documents", response_model=List[dict])
async def list_documents():
    """列出所有文檔"""
    docs_dir = Path("documents")
    if not docs_dir.exists():
        return []
    
    documents = []
    for file_path in docs_dir.glob("*"):
        if file_path.is_file():
            documents.append({
                "filename": file_path.name,
                "size": file_path.stat().st_size,
                "modified": file_path.stat().st_mtime
            })
    
    return documents


@app.get("/voices", response_model=List[dict])
async def list_voices():
    """獲取所有可用的語音列表"""
    try:
        voices = await edge_tts.list_voices()
        # 篩選中文語音
        chinese_voices = [
            {
                "name": voice["ShortName"],
                "display_name": voice["DisplayName"],
                "locale": voice["Locale"],
                "gender": voice["Gender"]
            }
            for voice in voices
            if voice["Locale"].startswith("zh-")
        ]
        return chinese_voices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取語音列表失敗: {str(e)}")


@app.post("/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """將文字轉換為語音"""
    try:
        # 生成唯一文件名
        file_name = f"{uuid.uuid4()}.mp3"
        file_path = AUDIO_DIR / file_name
        
        # 使用 Edge-TTS 生成語音
        communicate = edge_tts.Communicate(
            request.text, 
            request.voice,
            rate=request.rate,
            volume=request.volume
        )
        
        # 保存語音文件
        await communicate.save(str(file_path))
        
        # 返回音頻文件的URL
        return {
            "success": True,
            "audio_url": f"/audio/{file_name}",
            "voice": request.voice
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"語音合成失敗: {str(e)}")


@app.get("/audio/{file_name}")
async def get_audio(file_name: str):
    """獲取生成的音頻文件"""
    file_path = AUDIO_DIR / file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="音頻文件不存在")
    
    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=file_name
    )


@app.post("/query-with-speech")
async def query_with_speech(request: QueryRequest):
    """查詢知識庫並返回語音回答"""
    try:
        # 先執行普通查詢
        result = await query_knowledge_base(request)
        answer = result["answer"]
        
        # 生成唯一文件名
        file_name = f"{uuid.uuid4()}.mp3"
        file_path = AUDIO_DIR / file_name
        
        # 使用 Edge-TTS 生成語音
        communicate = edge_tts.Communicate(
            answer, 
            "zh-TW-HsiaoChenNeural"  # 默認使用台灣女聲
        )
        
        # 保存語音文件
        await communicate.save(str(file_path))
        
        # 將語音URL添加到結果中
        result["audio_url"] = f"/audio/{file_name}"
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查詢或語音合成失敗: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

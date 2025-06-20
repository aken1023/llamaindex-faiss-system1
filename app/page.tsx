"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, Search, FileText, Database, Cpu, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// API 基礎 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function KnowledgeBaseSystem() {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [indexStatus, setIndexStatus] = useState("ready")
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [loadingDots, setLoadingDots] = useState("")

  // 載入文件列表和系統狀態
  useEffect(() => {
    fetchDocuments();
    fetchSystemStatus();
  }, []);

  // 動畫效果 - 載入中的動畫點
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 400);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [isLoading]);

  // 獲取文件列表
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      const data = await response.json();
      setUploadedFiles(data.map((doc: any) => doc.filename));
    } catch (error) {
      console.error("獲取文件列表失敗", error);
    }
  };

  // 獲取系統狀態
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      const data = await response.json();
      setSystemStatus(data);
      setIndexStatus(data.status === "running" ? "ready" : "building");
    } catch (error) {
      console.error("獲取系統狀態失敗", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIndexStatus("building");
    
    // 為每個文件創建 FormData 並上傳
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          console.log(`文件 ${file.name} 上傳成功`);
        }
      } catch (error) {
        console.error(`上傳文件 ${file.name} 失敗`, error);
      }
    }
    
    // 重新獲取更新後的文件列表和系統狀態
    fetchDocuments();
    fetchSystemStatus();
    setIndexStatus("ready");
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(""); // 清空舊回應
    
    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          top_k: 5
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResponse(data.answer);
      } else {
        setResponse("查詢失敗，請稍後再試。");
      }
    } catch (error) {
      console.error("查詢失敗", error);
      setResponse("網絡錯誤，無法連接到知識庫服務。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">企業知識庫系統</h1>
          <p className="text-xl text-gray-600 mb-6">LlamaIndex + FAISS + DeepSeek LLM 私有化部署方案</p>
          <div className="flex justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2">
              <Database className="w-4 h-4 mr-2" />
              FAISS 向量數據庫
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Cpu className="w-4 h-4 mr-2" />
              DeepSeek LLM
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <FileText className="w-4 h-4 mr-2" />
              LlamaIndex
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="query" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="query">智能查詢</TabsTrigger>
            <TabsTrigger value="upload">文檔管理</TabsTrigger>
            <TabsTrigger value="system">系統狀態</TabsTrigger>
          </TabsList>

          {/* 查詢界面 */}
          <TabsContent value="query">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    知識查詢
                  </CardTitle>
                  <CardDescription>輸入您的問題，系統將從知識庫中檢索相關信息並生成回答</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="請輸入您的問題，例如：什麼是生成式AI？"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isLoading}
                  />
                  <Button onClick={handleQuery} disabled={isLoading || !query.trim()} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        查詢中{loadingDots}
                      </>
                    ) : (
                      "開始查詢"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    AI 回答
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                      <Loader2 className="h-10 w-10 animate-spin mb-4" />
                      <p className="text-center">正在思考中{loadingDots}</p>
                      <p className="text-sm text-gray-400 mt-2">從知識庫檢索資料並生成回答...</p>
                    </div>
                  ) : response ? (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">{response}</pre>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">請輸入問題開始查詢</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 文檔上傳界面 */}
          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    文檔上傳
                  </CardTitle>
                  <CardDescription>上傳文檔到知識庫，支持 PDF、TXT、DOCX 等格式</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">拖拽文件到此處或點擊上傳</p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.docx,.md"
                      onChange={handleFileUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>已上傳文檔</CardTitle>
                  <CardDescription>當前知識庫中的文檔列表</CardDescription>
                </CardHeader>
                <CardContent>
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{file}</span>
                          <Badge variant="outline" className="ml-auto">
                            已索引
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">尚未上傳任何文檔</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 系統狀態界面 */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">向量索引狀態</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>FAISS 索引</span>
                      <Badge variant={indexStatus === "ready" ? "default" : "secondary"}>
                        {indexStatus === "ready" ? "就緒" : "建立中"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>文檔數量</span>
                      <span>{uploadedFiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>向量維度</span>
                      <span>768</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">LLM 狀態</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>模型狀態</span>
                      <Badge variant="default">運行中</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>模型名稱</span>
                      <span>Mistral-7B</span>
                    </div>
                    <div className="flex justify-between">
                      <span>響應時間</span>
                      <span>~2.3s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">系統資源</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>CPU 使用率</span>
                      <span>45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>內存使用</span>
                      <span>2.1GB / 8GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>存儲空間</span>
                      <span>1.2GB / 100GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-6">
              <AlertDescription>系統運行正常。建議定期備份向量索引和配置文件。</AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

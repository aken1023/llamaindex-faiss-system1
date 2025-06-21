"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Upload, Search, FileText, Database, Cpu, MessageSquare, Loader2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// API 基礎 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Voice {
  name: string;
  display_name: string;
  locale: string;
  gender: string;
}

// 默認語音選項，以防API無法獲取
const DEFAULT_VOICES: Voice[] = [
  {
    name: "zh-TW-HsiaoChenNeural",
    display_name: "曉臻 (女聲)",
    locale: "zh-TW",
    gender: "Female"
  },
  {
    name: "zh-TW-YunJheNeural",
    display_name: "雲哲 (男聲)",
    locale: "zh-TW",
    gender: "Male"
  },
  {
    name: "zh-CN-XiaoxiaoNeural",
    display_name: "曉曉 (女聲)",
    locale: "zh-CN",
    gender: "Female"
  }
];

export default function KnowledgeBaseSystem() {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [indexStatus, setIndexStatus] = useState("ready")
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [loadingDots, setLoadingDots] = useState("")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [voices, setVoices] = useState<Voice[]>(DEFAULT_VOICES)
  const [selectedVoice, setSelectedVoice] = useState("zh-TW-HsiaoChenNeural")
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 載入文件列表和系統狀態
  useEffect(() => {
    fetchDocuments();
    fetchSystemStatus();
    fetchVoices();
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

  // 獲取語音列表
  const fetchVoices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/voices`);
      if (!response.ok) {
        console.error("獲取語音列表失敗，使用默認語音");
        return;
      }
      
      const data = await response.json();
      
      // 確保返回的數據是數組
      if (Array.isArray(data) && data.length > 0) {
        setVoices(data);
      } else {
        console.warn("獲取的語音列表為空或格式不正確，使用默認語音");
      }
    } catch (error) {
      console.error("獲取語音列表失敗", error);
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

  const handleQuery = async (withSpeech = false) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(""); // 清空舊回應
    setAudioUrl(null); // 清空舊的音頻URL
    
    try {
      const endpoint = withSpeech ? `${API_BASE_URL}/query-with-speech` : `${API_BASE_URL}/query`;
      
      const response = await fetch(endpoint, {
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
        
        // 如果有語音URL，設置它
        if (data.audio_url) {
          setAudioUrl(`${API_BASE_URL}${data.audio_url}`);
        }
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

  // 生成語音
  const generateSpeech = async () => {
    if (!response) return;
    
    try {
      const speechResponse = await fetch(`${API_BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: response,
          voice: selectedVoice
        }),
      });
      
      if (speechResponse.ok) {
        const data = await speechResponse.json();
        setAudioUrl(`${API_BASE_URL}${data.audio_url}`);
      }
    } catch (error) {
      console.error("生成語音失敗", error);
    }
  };

  // 播放/暫停音頻
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 音頻播放結束時的處理
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">企業知識庫系統</h1>
          <p className="text-xl text-slate-800 mb-6">LlamaIndex + FAISS + DeepSeek LLM 私有化部署方案</p>
          <div className="flex justify-center gap-4 mb-8">
            <Badge variant="secondary" className="px-4 py-2 bg-white text-slate-800 border border-slate-200">
              <Database className="w-4 h-4 mr-2" />
              FAISS 向量數據庫
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-white text-slate-800 border border-slate-200">
              <Cpu className="w-4 h-4 mr-2" />
              DeepSeek LLM
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-white text-slate-800 border border-slate-200">
              <FileText className="w-4 h-4 mr-2" />
              LlamaIndex
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="query" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 p-1 rounded-lg">
            <TabsTrigger value="query" className="text-slate-800 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">智能查詢</TabsTrigger>
            <TabsTrigger value="upload" className="text-slate-800 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">文檔管理</TabsTrigger>
            <TabsTrigger value="system" className="text-slate-800 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white">系統狀態</TabsTrigger>
          </TabsList>

          {/* 查詢界面 */}
          <TabsContent value="query">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Search className="w-5 h-5" />
                    知識查詢
                  </CardTitle>
                  <CardDescription className="text-slate-600">輸入您的問題，系統將從知識庫中檢索相關信息並生成回答</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 bg-white">
                  <Textarea
                    placeholder="請輸入您的問題，例如：什麼是生成式AI？"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px] border-slate-300 focus:border-blue-500 bg-white text-slate-800"
                    disabled={isLoading}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleQuery(false)} 
                      disabled={isLoading || !query.trim()} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          查詢中{loadingDots}
                        </>
                      ) : (
                        "開始查詢"
                      )}
                    </Button>
                    <Button 
                      onClick={() => handleQuery(true)} 
                      disabled={isLoading || !query.trim()} 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      title="查詢並自動生成語音回答"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <MessageSquare className="w-5 h-5" />
                    AI 回答
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-700">
                      <Loader2 className="h-10 w-10 animate-spin mb-4" />
                      <p className="text-center">正在思考中{loadingDots}</p>
                      <p className="text-sm text-slate-600 mt-2">從知識庫檢索資料並生成回答...</p>
                    </div>
                  ) : response ? (
                    <div className="space-y-4">
                      <div className="relative prose prose-sm max-w-none">
                        <div className="absolute top-2 right-2 flex gap-2">
                          {audioUrl ? (
                            <Button 
                              onClick={toggleAudio} 
                              variant="ghost" 
                              size="sm"
                              className="flex items-center gap-1 h-8 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200"
                            >
                              {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              <span className="text-xs">{isPlaying ? "停止" : "播放"}</span>
                            </Button>
                          ) : (
                            <Button 
                              onClick={generateSpeech} 
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 h-8 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200"
                            >
                              <Volume2 className="h-4 w-4" />
                              <span className="text-xs">語音</span>
                            </Button>
                          )}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded-lg border border-slate-200 text-slate-800">{response}</pre>
                        {audioUrl && (
                          <audio 
                            ref={audioRef} 
                            src={audioUrl} 
                            onEnded={handleAudioEnded}
                            style={{ display: 'none' }}
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <div className="text-sm text-slate-600 mr-2">語音設置:</div>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                          <SelectTrigger className="w-[240px] h-8 text-sm">
                            <SelectValue placeholder="選擇語音" />
                          </SelectTrigger>
                          <SelectContent>
                            {voices && Array.isArray(voices) && voices.length > 0 ? (
                              voices.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name}>
                                  {voice.display_name}
                                </SelectItem>
                              ))
                            ) : (
                              DEFAULT_VOICES.map((voice) => (
                                <SelectItem key={voice.name} value={voice.name}>
                                  {voice.display_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-700 text-center py-8">請輸入問題開始查詢</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 文檔上傳界面 */}
          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Upload className="w-5 h-5" />
                    文檔上傳
                  </CardTitle>
                  <CardDescription className="text-slate-600">上傳文檔到知識庫，支持 PDF、TXT、DOCX 等格式</CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                    <Upload className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-slate-700 mb-4">拖拽文件到此處或點擊上傳</p>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.docx,.md"
                      onChange={handleFileUpload}
                      className="max-w-xs mx-auto bg-white text-slate-800"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-slate-800">已上傳文檔</CardTitle>
                  <CardDescription className="text-slate-600">當前知識庫中的文檔列表</CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                          <FileText className="w-4 h-4 text-slate-700" />
                          <span className="text-sm text-slate-800">{file}</span>
                          <Badge variant="outline" className="ml-auto text-slate-700 border-slate-300">
                            已索引
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-700 text-center py-8">尚未上傳任何文檔</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 系統狀態界面 */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-lg text-slate-800">向量索引狀態</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">FAISS 索引</span>
                      <Badge variant={indexStatus === "ready" ? "default" : "secondary"} className="bg-blue-600 text-white">
                        {indexStatus === "ready" ? "就緒" : "建立中"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">文檔數量</span>
                      <span className="text-slate-800">{uploadedFiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">向量維度</span>
                      <span className="text-slate-800">768</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-lg text-slate-800">LLM 狀態</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">模型狀態</span>
                      <Badge variant="default" className="bg-green-600 text-white">運行中</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">模型名稱</span>
                      <span className="text-slate-800">Mistral-7B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">響應時間</span>
                      <span className="text-slate-800">~2.3s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-lg text-slate-800">系統資源</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">CPU 使用率</span>
                      <span className="text-slate-800">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">內存使用</span>
                      <span className="text-slate-800">2.1GB / 8GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">存儲空間</span>
                      <span className="text-slate-800">1.2GB / 100GB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-6 bg-blue-50 text-blue-800 border border-blue-200">
              <AlertDescription className="font-medium">系統運行正常。建議定期備份向量索引和配置文件。</AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

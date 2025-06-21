@echo off
rem 多用戶 RAG 系統啟動腳本 (Windows版本)

echo ==============================
echo 多用戶知識庫系統啟動工具
echo ==============================
echo.

rem 檢查Python
echo 檢查 Python 環境...
echo 檢查 Python 環境...
echo 檢查 Python 環境...
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 錯誤: 未找到Python。請安裝Python 3.8+
    pause
    exit /b 1
)

rem 檢查Python版本
for /f "tokens=*" %%a in ('python -c "import sys; print('{0}.{1}'.format(sys.version_info[0], sys.version_info[1]))"') do set PY_VER=%%a
for /f "tokens=1,2 delims=." %%a in ("%PY_VER%") do (
    set PY_MAJOR=%%a
    set PY_MINOR=%%b
)

echo 檢測到 Python %PY_VER%

if %PY_MAJOR% LSS 3 (
    echo 警告: Python版本低於推薦的 3.8+。部分功能可能無法正常運作。
    set /p CONTINUE="是否仍要繼續？(y/n): "
    if /i not "%CONTINUE%"=="y" (
        echo 取消啟動。請安裝 Python 3.8+ 後再試。
        pause
        exit /b 1
    )
) else (
    if %PY_MAJOR% EQU 3 (
        if %PY_MINOR% LSS 8 (
            echo 警告: Python版本低於推薦的 3.8+。部分功能可能無法正常運作。
            set /p CONTINUE="是否仍要繼續？(y/n): "
            if /i not "%CONTINUE%"=="y" (
                echo 取消啟動。請安裝 Python 3.8+ 後再試。
                pause
                exit /b 1
            )
        )
    )
)

rem 檢查依賴
echo 檢查依賴項...

rem 檢查虛擬環境
set VENV_DIR=venv
if not exist %VENV_DIR% (
    echo 創建虛擬環境...
    python -m venv %VENV_DIR%
    if %ERRORLEVEL% neq 0 (
        echo 錯誤: 無法創建虛擬環境。請確認是否安裝了venv模組。
        pause
        exit /b 1
    )
)

rem 啟動虛擬環境
if exist "%VENV_DIR%\Scripts\activate.bat" (
    call "%VENV_DIR%\Scripts\activate.bat"
) else (
    echo 錯誤: 無法找到虛擬環境的激活腳本。
    pause
    exit /b 1
)

rem 安裝依賴
echo 確保所需依賴已安裝...
pip install -r scripts\requirements.txt
pip install PyJWT

rem 啟動多用戶系統
echo 啟動多用戶知識庫系統...
python scripts\run_multi_user.py

rem 腳本結束
echo 系統已停止運行
pause 
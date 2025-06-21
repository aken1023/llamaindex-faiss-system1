/**
 * API 配置文件
 * 根據環境變數設置API的基礎URL
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://ragaken.zeabur.app:8000';

/**
 * API 端點列表
 */
export const API_ENDPOINTS = {
  QUERY: `${API_BASE_URL}/query`,
  UPLOAD: `${API_BASE_URL}/upload`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
  STATUS: `${API_BASE_URL}/status`,
};

/**
 * 獲取API請求的headers
 */
export const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
};

/**
 * 獲取上傳文件的headers
 */
export const getUploadHeaders = () => {
  return {
    Accept: 'application/json',
  };
}; 
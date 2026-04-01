import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import loginUtils from '@/services/authService';

// API 基礎 URL，可以從環境變數設定
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jsonplaceholder.typicode.com'

// 全域請求管理器
class RequestManager {
  private controllers: Set<AbortController> = new Set()

  createController() {
    const controller = new AbortController()
    this.controllers.add(controller)

    // 當請求完成或被取消時，從集合中移除
    controller.signal.addEventListener('abort', () => {
      this.controllers.delete(controller)
    })

    return controller
  }

  // 取消所有進行中的請求
  cancelAllRequests() {
    console.log(`取消 ${this.controllers.size} 個進行中的請求`)
    this.controllers.forEach(controller => {
      controller.abort()
    })
    this.controllers.clear()
  }

  // 獲取進行中的請求數量
  getPendingRequestsCount() {
    console.log(`目前有 ${this.controllers.size} 個進行中的請求`)
    return this.controllers.size
  }
}
const requestManager = new RequestManager()

// 建立 Axios 實例
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-ACCOUNT': '847594ec-9479-4051-803b-cf045dcf4964',
    'X-CHATBOT': 'ee9b30ed-f171-4351-9730-6ef6986a5188',
  },
})

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    // 在發送請求之前做些什麼
    // 例如：添加認證 token
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    //console.log('發送請求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('請求錯誤:', error)
    return Promise.reject(error)
  }
)

// 回應攔截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 2xx 範圍內的狀態代碼會觸發此函數
    //console.log('收到回應:', response.status, response.config.url)
    return response
  },
  (error) => {
    // 超出 2xx 範圍的狀態代碼會觸發此函數
    console.error('回應錯誤:', error.response?.status, error.message)

    if (error.response?.status === 401) {
      // 處理未授權錯誤
      loginUtils.logout();
      // 可以在這裡重新導向到登入頁面
      // router.push('/login')
    }

    return Promise.reject(error)
  }
)

// HTTP 方法封裝
export const httpService = {
  // 設定 token
  setAuthToken: (token: string) => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  },
  // 取消所有請求
  cancelAllRequests: () => {
    requestManager.cancelAllRequests()
  },

  // request methods
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const controller = requestManager.createController()
    return apiClient.get(url, { ...config, signal: controller.signal })
  },

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const controller = requestManager.createController()
    return apiClient.post(url, data, { ...config, signal: controller.signal })
  },

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const controller = requestManager.createController()
    return apiClient.put(url, data, { ...config, signal: controller.signal })
  },

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const controller = requestManager.createController()
    return apiClient.patch(url, data, { ...config, signal: controller.signal })
  },

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const controller = requestManager.createController()
    return apiClient.delete(url, { ...config, signal: controller.signal })
  },

  // promise all 封裝 (axios 沒有 promise all)
  all: async <T = unknown>(requests: Promise<AxiosResponse<T>>[]): Promise<{
    haveFailed: boolean;
    results: AxiosResponse<T>[] | null;
    error?: any;
  }> => {
    const re = {
      haveFailed: false, // 是否有失敗的 ajax
      results: null as AxiosResponse<T>[] | null,
      error: undefined as any
    };
    try {
      const results = await Promise.all(requests);
      // 依照公司統一規則非 996600001 都算失敗
      re.haveFailed = results.some((item: any) => item?.errorCode && item.errorCode !== '996600001');
      re.results = results;
      return re;
    } catch (error) {
      re.haveFailed = true;
      re.error = error;
      return re; // 不要 reject，而是返回錯誤資訊
    }
  },
}

// 導出 axios 實例以供直接使用
export { apiClient }
export default httpService


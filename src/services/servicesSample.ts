// TODO... 這是專案再起的時候 AI 提供的一個 api service 範例檔案，可以根據實際需求進行修改。
//.        或是要寫別的 service 時可以參考這個範例來撰寫。

import { httpService } from './http'
// import type { User } from '../stores/user'
export interface User { id: string; }

// 定義 API 服務接口的 TypeScript 類型, 之後如果後端 api 的回應格式都是統一的話，可以把 ApiResponse<T> 定義在 http.ts 裡面，然後在這裡直接使用，這樣就不會有重複定義的問題了。
export interface ApiResponse<T> {
  data: T
  message?: string
  status: number
}

export interface UserApiService {
  getUsers(): Promise<User[]>
  getUser(id: number): Promise<User>
  createUser(user: Omit<User, 'id'>): Promise<User>
  updateUser(id: number, user: Partial<User>): Promise<User>
  deleteUser(id: number): Promise<void>
}

// 用戶相關 API 服務
export const userApiService: UserApiService = {
  async getUsers(): Promise<User[]> {
    try {
      const response = await httpService.get<User[]>('/users')
      return response.data
    } catch (error) {
      console.error('獲取用戶列表失敗:', error)
      throw error
    }
  },

  async getUser(id: number): Promise<User> {
    try {
      const response = await httpService.get<User>(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`獲取用戶 ${id} 失敗:`, error)
      throw error
    }
  },

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const response = await httpService.post<User>('/users', user)
      return response.data
    } catch (error) {
      console.error('創建用戶失敗:', error)
      throw error
    }
  },

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    try {
      const response = await httpService.put<User>(`/users/${id}`, user)
      return response.data
    } catch (error) {
      console.error(`更新用戶 ${id} 失敗:`, error)
      throw error
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await httpService.delete(`/users/${id}`)
    } catch (error) {
      console.error(`刪除用戶 ${id} 失敗:`, error)
      throw error
    }
  },
}

// 通用 API 錯誤處理
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return '發生未知錯誤'
}

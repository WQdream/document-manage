import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://192.168.1.104:3001/api', // 后端API的基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 分类相关API
export const categoryApi = {
  // 获取所有分类
  getAllCategories: () => api.get('/categories'),
  
  // 获取单个分类及其组件
  getCategoryById: (id: number) => api.get(`/categories/${id}`),
  
  // 创建分类
  createCategory: (data: any) => api.post('/categories', data),
  
  // 更新分类
  updateCategory: (id: number, data: any) => api.put(`/categories/${id}`, data),
  
  // 删除分类
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),
  
  // 获取菜单结构
  getMenuStructure: () => api.get('/categories/menu/structure')
};

// 组件相关API
export const componentApi = {
  // 获取所有组件
  getAllComponents: () => api.get('/components'),
  
  // 获取单个组件
  getComponentById: (id: number) => api.get(`/components/${id}`),
  
  // 根据componentId获取组件
  getComponentByComponentId: (componentId: string) => api.get(`/components/by-component-id/${componentId}`),
  
  // 创建组件
  createComponent: (data: any) => api.post('/components', data),
  
  // 更新组件
  updateComponent: (id: number, data: any) => api.put(`/components/${id}`, data),
  
  // 删除组件
  deleteComponent: (id: number) => api.delete(`/components/${id}`)
};

// 组件文档相关API
export const componentDocApi = {
  // 获取所有文档
  getAllDocs: () => api.get('/docs'),
  
  // 获取单个文档
  getDocById: (id: number) => api.get(`/docs/${id}`),
  
  // 根据组件ID获取文档
  getDocByComponentId: (componentId: string) => api.get(`/docs/by-component/${componentId}`),
  
  // 创建文档
  createDoc: (data: any) => api.post('/docs', data),
  
  // 更新文档
  updateDoc: (id: number, data: any) => api.put(`/docs/${id}`, data),
  
  // 删除文档
  deleteDoc: (id: number) => api.delete(`/docs/${id}`),
  
  // 导入Markdown文档
  importMarkdown: (componentId: string, markdownContent: string) => 
    api.post(`/docs/import-markdown`, { componentId, markdownContent }),
  
  // 导出Markdown文档
  exportMarkdown: (componentId: string) => 
    api.get(`/docs/export-markdown/${componentId}`, { responseType: 'blob' })
};

// 操作日志相关API
export const operationLogApi = {
  // 获取所有日志
  getAllLogs: (params?: { page?: number, limit?: number, type?: string, startDate?: string, endDate?: string }) => 
    api.get('/logs', { params }),
  
  // 获取单个日志详情
  getLogById: (id: number) => api.get(`/logs/${id}`),
  
  // 删除日志
  deleteLog: (id: number) => api.delete(`/logs/${id}`),
  
  // 批量删除日志
  batchDeleteLogs: (ids: number[]) => api.post('/logs/batch-delete', { ids }),
  
  // 清空特定日期之前的日志
  clearLogsBefore: (date: string) => api.post('/logs/clear-before', { date })
};

export default api;
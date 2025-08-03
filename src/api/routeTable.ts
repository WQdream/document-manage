import { request } from './index'

export interface RouteTable {
  id: number
  name: string
  type: 'source' | 'standard'
  description?: string
  originalFileName?: string
  fileSize?: number
  totalRows: number
  status: 'active' | 'archived'
  recordCount?: number
  createdAt: string
  updatedAt: string
}

export interface RouteRecord {
  id: number
  tableId: number
  routeId?: number
  parentId?: number
  name?: string
  path?: string
  title?: string
  icon?: string
  notCache?: boolean
  hideInMenu?: boolean
  component?: string
  redirect?: string
  order?: number
  src?: string
  keyRule?: string
  isActive?: boolean
  moduleId?: number
  nav?: string
  type?: string
  moduleName?: string
  model?: string
  word?: string
  isSelected?: boolean
  sourceRecordId?: number
  rowIndex?: number
  existsInTarget?: boolean
  conflictInfo?: any
}

export interface MigrationSession {
  id: number
  name: string
  sourceTableId: number
  targetTableId: number
  status: 'draft' | 'completed' | 'exported'
  selectedCount: number
  description?: string
  sourceTable?: RouteTable
  targetTable?: RouteTable
  createdAt: string
  updatedAt: string
}

// 路由表管理API
export const routeTableApi = {
  // 获取所有路由表
  getAllTables(): Promise<{ success: boolean; data: RouteTable[] }> {
    return request.get('/route-tables')
  },

  // 上传Excel文件
  uploadExcel(formData: FormData): Promise<{ success: boolean; data: any; message: string }> {
    return request.post('/route-tables/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取路由表详情
  getTableDetail(id: number, params?: { page?: number; pageSize?: number; search?: string }) {
    return request.get(`/route-tables/${id}`, { params })
  },

  // 重新导入Excel文件
  reimportExcel(id: number, formData: FormData): Promise<{ success: boolean; data: any; message: string }> {
    return request.post(`/route-tables/${id}/reimport`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除路由表
  deleteTable(id: number): Promise<{ success: boolean; message: string }> {
    return request.delete(`/route-tables/${id}`)
  }
}

// 迁移管理API
export const migrationApi = {
  // 创建迁移会话
  createSession(data: {
    name: string
    sourceTableId: number
    targetTableId: number
    description?: string
  }): Promise<{ success: boolean; data: MigrationSession; message: string }> {
    return request.post('/migration/sessions', data)
  },

  // 获取迁移会话列表
  getSessions(): Promise<{ success: boolean; data: MigrationSession[] }> {
    return request.get('/migration/sessions')
  },

  // 获取对比数据
  getComparisonData(sessionId: number, params?: {
    page?: number
    pageSize?: number
    search?: string
    showSelected?: boolean
    showSelectableOnly?: boolean
    moduleFilter?: string
    advancedFilter?: {
      enabled: boolean
      sameFields: string[]
      differentFields: string[]
    }
  }) {
    return request.get(`/migration/sessions/${sessionId}/comparison`, { params })
  },

  // 获取模块选项
  getModuleOptions(sessionId: number): Promise<{ success: boolean; data: string[] }> {
    return request.get(`/migration/sessions/${sessionId}/modules`)
  },

  // 切换选择状态
  toggleSelection(sessionId: number, data: {
    recordIds: number[]
    selected: boolean
  }): Promise<{ success: boolean; data: { selectedCount: number }; message: string }> {
    return request.post(`/migration/sessions/${sessionId}/toggle-selection`, data)
  },

  // 执行迁移
  executeMigration(sessionId: number, data: {
    overwriteConflicts?: boolean
  }): Promise<{ success: boolean; data: any; message: string }> {
    return request.post(`/migration/sessions/${sessionId}/execute`, data)
  },

  // 导出表格
  exportTable(tableId: number): Promise<Blob> {
    return request.get(`/migration/export/${tableId}`, {
      responseType: 'blob'
    })
  },

  // 删除迁移会话
  deleteSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    return request.delete(`/migration/sessions/${sessionId}`)
  }
}
<template>
  <div class="route-migration">
    <div class="header">
      <el-button @click="$router.back()" type="text">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 v-if="sessionInfo">{{ sessionInfo.name }} - 路由迁移</h2>
    </div>

    <!-- 会话信息 -->
    <el-card class="session-info" v-if="sessionInfo">
      <div class="info-grid">
        <div class="info-item">
          <label>源表：</label>
          <span>{{ sessionInfo.sourceTable?.name }}</span>
        </div>
        <div class="info-item">
          <label>目标表：</label>
          <span>{{ sessionInfo.targetTable?.name }}</span>
        </div>
        <div class="info-item">
          <label>已选择：</label>
          <span>{{ sessionInfo.selectedCount }} 条记录</span>
        </div>
        <div class="info-item">
          <label>状态：</label>
          <el-tag :type="getStatusType(sessionInfo.status)">
            {{ getStatusText(sessionInfo.status) }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 操作栏 -->
    <div class="controls">
      <div class="left-controls">
        <el-input
          v-model="searchText"
          placeholder="搜索路由..."
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="selectedModule"
          placeholder="选择模块"
          clearable
          filterable
          style="width: 200px"
          @change="handleModuleChange"
        >
          <el-option
            v-for="module in moduleOptions"
            :key="module.value"
            :label="module.label"
            :value="module.value"
          />
        </el-select>
        <el-checkbox v-model="showSelectedOnly" @change="loadRecords">
          只显示已选择
        </el-checkbox>
        <el-checkbox v-model="showSelectableOnly" @change="loadRecords">
          只显示可选择
        </el-checkbox>
        <el-button @click="showAdvancedFilter = true" type="primary" plain size="small">
          <el-icon><Filter /></el-icon>
          高级过滤
        </el-button>
      </div>
      <div class="right-controls">
        <el-button @click="selectAll">全选</el-button>
        <el-button @click="unselectAll">取消全选</el-button>
        <el-button type="primary" @click="showExecuteDialog = true" :disabled="sessionInfo?.selectedCount === 0">
          执行迁移 ({{ sessionInfo?.selectedCount || 0 }})
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域：左右分栏布局 -->
    <div class="main-content">
      <!-- 左侧：数据表格 -->
      <div class="left-panel">
        <el-card class="table-card">
          <template #header>
            <div class="table-header">
              <span>源表路由数据</span>
              <span class="table-stats">共 {{ total }} 条记录</span>
            </div>
          </template>
          
          <el-table 
            :data="records" 
            v-loading="loading" 
            style="width: 100%;" 
            class="auto-height-table"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" :selectable="row => !row.existsInTarget || row.canUpdate" />
            <el-table-column label="行号" width="80">
              <template #default="{ $index }">
                {{ (currentPage - 1) * pageSize + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="routeId" label="ID"/>
            <el-table-column prop="name" label="名称"/>
            <el-table-column prop="title" label="标题"/>
            <el-table-column prop="path" label="路径"/>
            <el-table-column prop="component" label="组件"/>
            <el-table-column prop="moduleName" label="模块名称"/>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.existsInTarget && !row.canUpdate" type="warning" size="small">已存在</el-tag>
                <el-tooltip 
                  v-else-if="row.canUpdate" 
                  placement="top"
                  :disabled="!row.conflictInfo || !row.conflictInfo.differences || row.conflictInfo.differences.length === 0"
                  raw-content
                >
                  <template #content>
                    <div class="difference-tooltip">
                      <div class="tooltip-title">
                        <el-icon><InfoFilled /></el-icon>
                        字段差异对比
                      </div>
                      <div class="tooltip-subtitle">
                        以下字段在源表和目标表中存在差异，迁移后将更新目标表：
                      </div>
                      <div 
                        v-for="(field, index) in row.conflictInfo?.differences || []" 
                        :key="index"
                        class="tooltip-item"
                      >
                        <div class="field-name">{{ getFieldLabel(field) }}</div>
                        <div class="value-comparison">
                          <div class="value-row">
                            <span class="value-label">当前值:</span>
                            <span class="target-value">{{ formatValue(row.conflictInfo?.matchingRecord?.[field]) }}</span>
                          </div>
                          <div class="value-row">
                            <span class="value-label">更新为:</span>
                            <span class="source-value">{{ formatValue(row[field]) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <el-tag type="primary" size="small">可更新</el-tag>
                </el-tooltip>
                <el-tag v-else-if="row.isSelected" type="success" size="small">已选择</el-tag>
                <el-tag v-else type="info" size="small">未选择</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button 
                  size="small" 
                  :type="row.isSelected ? 'danger' : 'primary'"
                  @click="toggleSingleSelection(row)"
                  :disabled="row.existsInTarget && !row.canUpdate"
                >
                  {{ row.isSelected ? '取消' : '选择' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="table-pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[20, 50, 100, 200]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadRecords"
              @current-change="loadRecords"
            />
          </div>
        </el-card>
      </div>

      <!-- 右侧：已选择路由 -->
      <div class="right-panel">
        <el-card class="selected-card">
          <template #header>
            <div class="selected-header">
              <span>已选择的路由</span>
              <el-tag type="success">{{ sessionInfo?.selectedCount || 0 }} 条</el-tag>
            </div>
          </template>
          
          <div class="selected-content">
            <div v-if="sessionInfo?.selectedCount === 0" class="empty-selected">
              <el-empty description="还没有选择任何路由" :image-size="80" />
            </div>
            
            <div v-else class="selected-routes-container">
              <div v-if="selectedRoutesList.length === 0" class="loading-selected">
                <el-button @click="loadSelectedRoutes" :loading="loadingSelected" type="primary">
                  加载已选择路由详情
                </el-button>
              </div>
              
              <div v-else class="selected-routes-list">
                <div 
                  v-for="route in selectedRoutesList" 
                  :key="route.id" 
                  class="selected-route-item"
                >
                  <div class="route-info">
                    <div class="route-name">{{ route.name || '未命名' }}</div>
                    <div class="route-details">
                      <div class="route-path">{{ route.path || '无路径' }}</div>
                      <div class="route-module">{{ route.moduleName || '无模块' }}</div>
                    </div>
                  </div>
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="toggleSingleSelection(route)"
                    class="remove-btn"
                    plain
                  >
                    移除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 高级过滤对话框 -->
    <el-dialog v-model="showAdvancedFilter" title="高级过滤设置" width="700px">
      <div class="advanced-filter-content">
        <el-alert
          title="说明"
          description="设置字段比对规则，当指定字段相同但其他字段不同时，记录将被标记为'可更新'状态，允许选择迁移。"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-form :model="filterConfig" label-width="120px">
          <el-form-item label="启用高级过滤">
            <el-switch v-model="filterConfig.enabled" @change="handleFilterToggle" />
          </el-form-item>
          
          <div v-if="filterConfig.enabled">
            <el-form-item label="必须相同字段">
              <el-select
                v-model="filterConfig.sameFields"
                multiple
                placeholder="选择必须相同的字段"
                style="width: 100%"
              >
                <el-option label="路由ID (routeId)" value="routeId" />
                <el-option label="路由名称 (name)" value="name" />
                <el-option label="路径 (path)" value="path" />
                <el-option label="标题 (title)" value="title" />
                <el-option label="组件 (component)" value="component" />
                <el-option label="模块ID (moduleId)" value="moduleId" />
                <el-option label="模块名称 (moduleName)" value="moduleName" />
              </el-select>
              <div class="field-help">这些字段必须完全相同才认为是同一条记录</div>
            </el-form-item>
            
            <el-form-item label="允许不同字段">
              <el-select
                v-model="filterConfig.differentFields"
                multiple
                placeholder="选择允许不同的字段"
                style="width: 100%"
              >
                <el-option label="权限规则 (keyRule)" value="keyRule" />
                <el-option label="图标 (icon)" value="icon" />
                <el-option label="排序 (order)" value="order" />
                <el-option label="重定向 (redirect)" value="redirect" />
                <el-option label="是否缓存 (notCache)" value="notCache" />
                <el-option label="菜单显示 (hideInMenu)" value="hideInMenu" />
                <el-option label="是否激活 (isActive)" value="isActive" />
                <el-option label="导航类型 (nav)" value="nav" />
                <el-option label="路由类型 (type)" value="type" />
                <el-option label="模型 (model)" value="model" />
                <el-option label="描述 (word)" value="word" />
              </el-select>
              <div class="field-help">当这些字段不同时，记录将标记为'可更新'而非'已存在'</div>
            </el-form-item>
          </div>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showAdvancedFilter = false">取消</el-button>
        <el-button type="primary" @click="applyAdvancedFilter">应用过滤</el-button>
      </template>
    </el-dialog>

    <!-- 执行迁移对话框 -->
    <el-dialog v-model="showExecuteDialog" title="执行迁移" width="500px">
      <div class="execute-info">
        <p>即将迁移 <strong>{{ sessionInfo?.selectedCount }}</strong> 条记录到目标表</p>
        <el-checkbox v-model="overwriteConflicts">
          覆盖冲突记录（如果目标表中已存在相同记录）
        </el-checkbox>
      </div>
      <template #footer>
        <el-button @click="showExecuteDialog = false">取消</el-button>
        <el-button type="primary" @click="executeMigration" :loading="executing">
          确认迁移
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Search, Filter, InfoFilled } from '@element-plus/icons-vue'
import { migrationApi, type MigrationSession, type RouteRecord } from '../api/routeTable'

const route = useRoute()
const router = useRouter()
const sessionId = parseInt(route.params.id as string)

// 响应式数据
const sessionInfo = ref<MigrationSession | null>(null)
const records = ref<RouteRecord[]>([])
const loading = ref(false)
const executing = ref(false)
const searchText = ref('')
const showSelectedOnly = ref(false)
const showSelectableOnly = ref(false)
const selectedModule = ref('')
const moduleOptions = ref<Array<{label: string, value: string}>>([])
const loadingModules = ref(false)

// 高级过滤相关数据
const showAdvancedFilter = ref(false)
const filterConfig = ref({
  enabled: false,
  sameFields: ['routeId'] as string[],
  differentFields: [] as string[]
})
const showExecuteDialog = ref(false)
const overwriteConflicts = ref(false)
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)
const selectedRows = ref<RouteRecord[]>([])

// 已选择路由相关数据
const showSelectedDetails = ref(false)
const selectedRoutesList = ref<RouteRecord[]>([])
const loadingSelected = ref(false)

// 方法
const loadRecords = async () => {
  loading.value = true
  try {
    const response = await migrationApi.getComparisonData(sessionId, {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined,
      showSelected: showSelectedOnly.value,
      showSelectableOnly: showSelectableOnly.value,
      moduleFilter: selectedModule.value || undefined,
      advancedFilter: filterConfig.value.enabled ? filterConfig.value : undefined
    })
    
    if (response.success) {
      sessionInfo.value = response.data.session
      records.value = response.data.sourceRecords
      total.value = response.data.pagination.total
      
      // 如果有选中的记录且还没有加载已选择列表，自动加载
      if (sessionInfo.value?.selectedCount > 0 && selectedRoutesList.value.length === 0) {
        loadSelectedRoutes()
      }
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadRecords()
}

const handleModuleChange = () => {
  currentPage.value = 1
  loadRecords()
}

// 加载模块列表
const loadModuleOptions = async () => {
  loadingModules.value = true
  try {
    const response = await migrationApi.getModuleOptions(sessionId)
    if (response.success) {
      moduleOptions.value = response.data.map((module: string) => ({
        label: module || '未分类',
        value: module || ''
      }))
    }
  } catch (error) {
    console.error('加载模块列表失败:', error)
  } finally {
    loadingModules.value = false
  }
}

// 高级过滤相关方法
const handleFilterToggle = () => {
  if (!filterConfig.value.enabled) {
    // 禁用时重置配置
    filterConfig.value.sameFields = ['routeId']
    filterConfig.value.differentFields = []
  }
}

const applyAdvancedFilter = () => {
  showAdvancedFilter.value = false
  loadRecords() // 重新加载数据
}

// 加载已选择的路由详情
const loadSelectedRoutes = async () => {
  loadingSelected.value = true
  try {
    const response = await migrationApi.getComparisonData(sessionId, {
      showSelected: true,
      pageSize: 1000 // 获取所有已选择的记录
    })
    
    if (response.success) {
      selectedRoutesList.value = response.data.sourceRecords.filter(r => r.isSelected)
    }
  } catch (error) {
    ElMessage.error('加载已选择路由失败')
  } finally {
    loadingSelected.value = false
  }
}

const handleSelectionChange = (selection: RouteRecord[]) => {
  selectedRows.value = selection
}

const toggleSingleSelection = async (record: RouteRecord) => {
  try {
    const response = await migrationApi.toggleSelection(sessionId, {
      recordIds: [record.id],
      selected: !record.isSelected
    })
    
    if (response.success) {
      record.isSelected = !record.isSelected
      if (sessionInfo.value) {
        sessionInfo.value.selectedCount = response.data.selectedCount
      }
      
      // 更新已选择列表
      if (record.isSelected) {
        // 添加到已选择列表
        if (!selectedRoutesList.value.find(r => r.id === record.id)) {
          selectedRoutesList.value.push(record)
        }
      } else {
        // 从已选择列表中移除
        selectedRoutesList.value = selectedRoutesList.value.filter(r => r.id !== record.id)
      }
      
      ElMessage.success('选择状态更新成功')
    }
  } catch (error) {
    ElMessage.error('更新选择状态失败')
  }
}

const selectAll = async () => {
  const availableRecords = records.value.filter(r => !r.existsInTarget && !r.isSelected)
  if (availableRecords.length === 0) {
    ElMessage.info('没有可选择的记录')
    return
  }

  try {
    const response = await migrationApi.toggleSelection(sessionId, {
      recordIds: availableRecords.map(r => r.id),
      selected: true
    })
    
    if (response.success) {
      availableRecords.forEach(record => {
        record.isSelected = true
        // 添加到已选择列表
        if (!selectedRoutesList.value.find(r => r.id === record.id)) {
          selectedRoutesList.value.push(record)
        }
      })
      if (sessionInfo.value) {
        sessionInfo.value.selectedCount = response.data.selectedCount
      }
      ElMessage.success(`已选择 ${availableRecords.length} 条记录`)
    }
  } catch (error) {
    ElMessage.error('批量选择失败')
  }
}

const unselectAll = async () => {
  const selectedRecords = records.value.filter(r => r.isSelected)
  if (selectedRecords.length === 0) {
    ElMessage.info('没有已选择的记录')
    return
  }

  try {
    const response = await migrationApi.toggleSelection(sessionId, {
      recordIds: selectedRecords.map(r => r.id),
      selected: false
    })
    
    if (response.success) {
      selectedRecords.forEach(record => {
        record.isSelected = false
      })
      // 清空已选择列表
      selectedRoutesList.value = []
      
      if (sessionInfo.value) {
        sessionInfo.value.selectedCount = response.data.selectedCount
      }
      ElMessage.success(`已取消选择 ${selectedRecords.length} 条记录`)
    }
  } catch (error) {
    ElMessage.error('批量取消选择失败')
  }
}

const executeMigration = async () => {
  executing.value = true
  try {
    const response = await migrationApi.executeMigration(sessionId, {
      overwriteConflicts: overwriteConflicts.value
    })
    
    if (response.success) {
      ElMessage.success(`迁移完成！成功迁移 ${response.data.migratedCount} 条记录`)
      showExecuteDialog.value = false
      loadRecords() // 重新加载数据
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '迁移失败')
  } finally {
    executing.value = false
  }
}

// 获取差异字段的提示信息
const getDifferenceTooltip = (row: RouteRecord) => {
  if (!row.conflictInfo || !row.conflictInfo.differences || row.conflictInfo.differences.length === 0) {
    return '可更新记录'
  }

  const fieldLabels: Record<string, string> = {
    routeId: '路由ID',
    parentId: '父级ID',
    name: '路由名称',
    path: '路径',
    title: '标题',
    icon: '图标',
    notCache: '是否缓存',
    hideInMenu: '菜单显示',
    component: '组件',
    redirect: '重定向',
    order: '排序',
    src: '源文件',
    keyRule: '权限规则',
    isActive: '是否激活',
    moduleId: '模块ID',
    nav: '导航类型',
    type: '路由类型',
    moduleName: '模块名称',
    model: '模型',
    word: '描述'
  }

  const differences = row.conflictInfo.differences.map((field: string) => {
    const label = fieldLabels[field] || field
    const sourceValue = row[field as keyof RouteRecord] || '空'
    const targetValue = row.conflictInfo?.matchingRecord?.[field] || '空'
    return `${label}: "${sourceValue}" → "${targetValue}"`
  })

  return `以下字段存在差异：\n${differences.join('\n')}`
}

// 获取字段的中文标签
const getFieldLabel = (field: string) => {
  const fieldLabels: Record<string, string> = {
    routeId: '路由ID',
    parentId: '父级ID',
    name: '路由名称',
    path: '路径',
    title: '标题',
    icon: '图标',
    notCache: '是否缓存',
    hideInMenu: '菜单显示',
    component: '组件',
    redirect: '重定向',
    order: '排序',
    src: '源文件',
    keyRule: '权限规则',
    isActive: '是否激活',
    moduleId: '模块ID',
    nav: '导航类型',
    type: '路由类型',
    moduleName: '模块名称',
    model: '模型',
    word: '描述'
  }
  return fieldLabels[field] || field
}

// 格式化字段值显示
const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return '(空)'
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return String(value)
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'draft': return 'info'
    case 'completed': return 'success'
    case 'exported': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return '草稿'
    case 'completed': return '已完成'
    case 'exported': return '已导出'
    default: return '未知'
  }
}

// 生命周期
onMounted(() => {
  loadRecords()
  loadModuleOptions()
})
</script>

<style scoped>
.route-migration {
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.session-info {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 80px;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.right-controls {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.execute-info {
  padding: 20px 0;
}

.execute-info p {
  margin-bottom: 15px;
  font-size: 16px;
}

/* 主要内容区域：左右分栏布局 */
.main-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 300px);
  min-height: 600px;
}

.left-panel {
  flex: 2;
  min-width: 0;
}

.right-panel {
  flex: 1;
  min-width: 350px;
  max-width: 450px;
}

/* 左侧表格卡片 */
.table-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-stats {
  color: #909399;
  font-size: 14px;
}

.auto-height-table {
  flex: 1;
  min-height: 0;
}

.auto-height-table :deep(.el-table) {
  height: 100% !important;
}

.auto-height-table :deep(.el-table__body-wrapper) {
  max-height: calc(100% - 40px) !important;
}

.table-pagination {
  margin-top: 16px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

/* 右侧已选择路由卡片 */
.selected-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.selected-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.empty-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-routes-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.loading-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-routes-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
  min-height: 0;
}

.selected-route-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.2s;
}

.selected-route-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.route-info {
  flex: 1;
  min-width: 0;
}

.route-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.route-path {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-module {
  font-size: 12px;
  color: #67c23a;
  background-color: #f0f9ff;
  padding: 2px 6px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.remove-btn {
  margin-left: 8px;
  flex-shrink: 0;
}

/* 高级过滤对话框样式 */
.advanced-filter-content {
  padding: 10px 0;
}

.field-help {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

/* 差异提示框样式 */
.difference-tooltip {
  max-width: 450px;
  padding: 12px;
  line-height: 1.5;
}

.tooltip-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 6px;
}

.tooltip-subtitle {
  font-size: 12px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.4;
}

.tooltip-item {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.tooltip-item:last-child {
  margin-bottom: 0;
}

.field-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  font-size: 13px;
}

.value-comparison {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-label {
  font-size: 12px;
  color: #909399;
  min-width: 50px;
  font-weight: 500;
}

.source-value {
  color: #67c23a;
  background-color: #f0f9ff;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #b3d8ff;
}

.target-value {
  color: #e6a23c;
  background-color: #fdf6ec;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace
}
</style>
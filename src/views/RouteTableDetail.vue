<template>
  <div class="route-table-detail">
    <div class="header">
      <el-button @click="$router.back()" type="text">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 v-if="tableInfo">{{ tableInfo.name }} - 详情</h2>
    </div>

    <!-- 表信息 -->
    <el-card class="table-info" v-if="tableInfo">
      <div class="info-grid">
        <div class="info-item">
          <label>表名称：</label>
          <span>{{ tableInfo.name }}</span>
        </div>
        <div class="info-item">
          <label>类型：</label>
          <el-tag :type="tableInfo.type === 'source' ? 'warning' : 'success'">
            {{ tableInfo.type === 'source' ? '源表' : '维护表' }}
          </el-tag>
        </div>
        <div class="info-item">
          <label>总记录数：</label>
          <span>{{ tableInfo.totalRows }}</span>
        </div>
        <div class="info-item">
          <label>原始文件：</label>
          <span>{{ tableInfo.originalFileName }}</span>
        </div>
        <div class="info-item">
          <label>创建时间：</label>
          <span>{{ formatDate(tableInfo.createdAt) }}</span>
        </div>
        <div class="info-item" v-if="tableInfo.description">
          <label>描述：</label>
          <span>{{ tableInfo.description }}</span>
        </div>
      </div>
    </el-card>

    <!-- 搜索和操作 -->
    <div class="controls">
      <el-input
        v-model="searchText"
        placeholder="搜索路由名称、标题、路径..."
        style="width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 路由记录表格 -->
    <el-table :data="records" v-loading="loading" style="width: 100%" max-height="600">
      <el-table-column prop="rowIndex" label="行号" width="80" />
      <el-table-column prop="routeId" label="ID" width="80" />
      <el-table-column prop="name" label="名称" width="120" />
      <el-table-column prop="title" label="标题" width="120" />
      <el-table-column prop="path" label="路径" width="150" />
      <el-table-column prop="component" label="组件" width="150" />
      <el-table-column prop="icon" label="图标" width="100" />
      <el-table-column prop="order" label="排序" width="80" />
      <el-table-column prop="moduleName" label="模块名称" width="120" />
      <el-table-column prop="isActive" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'danger'">
            {{ row.isActive ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="100" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { routeTableApi, type RouteTable, type RouteRecord } from '../api/routeTable'

const route = useRoute()
const tableId = parseInt(route.params.id as string)

// 响应式数据
const tableInfo = ref<RouteTable | null>(null)
const records = ref<RouteRecord[]>([])
const loading = ref(false)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)

// 方法
const loadRecords = async () => {
  loading.value = true
  try {
    const response = await routeTableApi.getTableDetail(tableId, {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined
    })
    
    if (response.success) {
      tableInfo.value = response.data.table
      records.value = response.data.records
      total.value = response.data.pagination.total
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.route-table-detail {
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.table-info {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
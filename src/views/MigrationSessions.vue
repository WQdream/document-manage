<template>
  <div class="migration-sessions">
    <div class="header">
      <h2>迁移会话管理</h2>
      <el-button type="primary" @click="$router.push('/route-manager')">
        <el-icon><Back /></el-icon>
        返回路由管理
      </el-button>
    </div>

    <!-- 会话列表 -->
    <el-table :data="sessions" v-loading="loading" style="width: 100%">
      <el-table-column prop="name" label="会话名称" width="200" />
      <el-table-column prop="sourceTable.name" label="源表" width="150" />
      <el-table-column prop="targetTable.name" label="目标表" width="150" />
      <el-table-column prop="selectedCount" label="已选择记录" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openMigration(row)">
            {{ row.status === 'draft' ? '继续迁移' : '查看详情' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteSession(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { migrationApi, type MigrationSession } from '../api/routeTable'

const router = useRouter()

// 响应式数据
const sessions = ref<MigrationSession[]>([])
const loading = ref(false)

// 方法
const loadSessions = async () => {
  loading.value = true
  try {
    const response = await migrationApi.getSessions()
    if (response.success) {
      sessions.value = response.data
    }
  } catch (error) {
    ElMessage.error('加载迁移会话失败')
  } finally {
    loading.value = false
  }
}

const openMigration = (session: MigrationSession) => {
  router.push(`/route-migration/${session.id}`)
}

const deleteSession = async (session: MigrationSession) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除迁移会话"${session.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    const response = await migrationApi.deleteSession(session.id)
    if (response.success) {
      ElMessage.success(response.message)
      loadSessions() // 重新加载会话列表
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.migration-sessions {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
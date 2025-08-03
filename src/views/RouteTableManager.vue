<template>
  <div class="route-table-manager">
    <div class="header">
      <h2>路由表管理</h2>
      <div class="actions">
        <el-button type="primary" @click="openUploadDialog">
          <el-icon><Upload /></el-icon>
          上传Excel
        </el-button>
        <el-button type="success" @click="showMigrationDialog = true">
          <el-icon><Switch /></el-icon>
          创建迁移
        </el-button>
        <el-button @click="$router.push('/migration-sessions')">
          <el-icon><List /></el-icon>
          迁移会话
        </el-button>
      </div>
    </div>

    <!-- 路由表列表 -->
    <el-table :data="tables" v-loading="loading" style="width: 100%">
      <el-table-column prop="name" label="表名称" width="200" />
      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === 'source' ? 'warning' : 'success'">
            {{ row.type === 'source' ? '源表' : '维护表' }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- <el-table-column prop="originalFileName" label="原始文件名" width="200" /> -->
      <el-table-column prop="recordCount" label="记录数" width="100" />
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button size="small" @click="viewTable(row)">查看</el-button>
          <el-button size="small" type="warning" @click="openReimportDialog(row)">
            重新导入
          </el-button>
          <el-button size="small" type="success" @click="exportTable(row)" v-if="row.type === 'standard'">
            导出
          </el-button>
          <el-button size="small" type="danger" @click="deleteTable(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传Excel文件" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="表名称" required>
          <el-input v-model="uploadForm.name" placeholder="请输入表名称" />
        </el-form-item>
        <el-form-item label="表类型" required>
          <el-select v-model="uploadForm.type" placeholder="请选择表类型">
            <el-option label="源表" value="source" />
            <el-option label="维护表" value="standard" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" rows="3" />
        </el-form-item>
        <el-form-item label="Excel文件" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传xlsx/xls文件，且不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelUpload">取消</el-button>
        <el-button type="primary" @click="handleUpload" :loading="uploading">上传</el-button>
      </template>
    </el-dialog>

    <!-- 重新导入对话框 -->
    <el-dialog v-model="showReimportDialog" title="重新导入Excel文件" width="500px">
      <el-alert
        title="注意"
        description="重新导入将完全替换该表的所有数据，此操作不可恢复！"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />
      
      <el-form :model="reimportForm" label-width="100px">
        <el-form-item label="当前表名">
          <el-input :value="currentTable?.name" disabled />
        </el-form-item>
        <el-form-item label="当前记录数">
          <el-input :value="currentTable?.recordCount + ' 条'" disabled />
        </el-form-item>
        <el-form-item label="Excel文件" required>
          <el-upload
            ref="reimportUploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleReimportFileChange"
            :file-list="reimportFileList"
          >
            <el-button type="primary">选择新文件</el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传xlsx/xls文件，且不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelReimport">取消</el-button>
        <el-button type="warning" @click="handleReimport" :loading="reimporting">
          确认重新导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建迁移对话框 -->
    <el-dialog v-model="showMigrationDialog" title="创建迁移会话" width="500px">
      <el-form :model="migrationForm" label-width="100px">
        <el-form-item label="会话名称" required>
          <el-input v-model="migrationForm.name" placeholder="请输入会话名称" />
        </el-form-item>
        <el-form-item label="源表" required>
          <el-select v-model="migrationForm.sourceTableId" placeholder="请选择源表">
            <el-option
              v-for="table in sourceTables"
              :key="table.id"
              :label="table.name"
              :value="table.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标表" required>
          <el-select v-model="migrationForm.targetTableId" placeholder="请选择目标表">
            <el-option
              v-for="table in standardTables"
              :key="table.id"
              :label="table.name"
              :value="table.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="migrationForm.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMigrationDialog = false">取消</el-button>
        <el-button type="primary" @click="createMigration" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Switch, List } from '@element-plus/icons-vue'
import { routeTableApi, migrationApi, type RouteTable } from '../api/routeTable'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const tables = ref<RouteTable[]>([])
const loading = ref(false)
const showUploadDialog = ref(false)
const showMigrationDialog = ref(false)
const showReimportDialog = ref(false)
const uploading = ref(false)
const creating = ref(false)
const reimporting = ref(false)
const currentTable = ref<RouteTable | null>(null)
const reimportFileList = ref<any[]>([])
const uploadRef = ref()
const reimportUploadRef = ref()

// 表单数据
const uploadForm = ref({
  name: '',
  type: 'source' as 'source' | 'standard',
  description: '',
  file: null as File | null
})

const migrationForm = ref({
  name: '',
  sourceTableId: null as number | null,
  targetTableId: null as number | null,
  description: ''
})

const reimportForm = ref({
  file: null as File | null
})

// 计算属性
const sourceTables = computed(() => tables.value.filter(t => t.type === 'source'))
const standardTables = computed(() => tables.value.filter(t => t.type === 'standard'))

// 方法
const openUploadDialog = () => {
  showUploadDialog.value = true
  uploadForm.value = { name: '', type: 'source', description: '', file: null }
  // 清空文件选择器
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const loadTables = async () => {
  loading.value = true
  try {
    console.log('开始加载路由表...')
    const response = await routeTableApi.getAllTables()
    console.log('API响应:', response)
    if (response.success) {
      tables.value = response.data
      console.log('设置tables数据:', tables.value)
    } else {
      console.error('API返回失败:', response)
      ElMessage.error('加载路由表失败: ' + (response.message || '未知错误'))
    }
  } catch (error) {
    console.error('加载路由表异常:', error)
    ElMessage.error('加载路由表失败')
  } finally {
    loading.value = false
  }
}

const handleFileChange = (file: any) => {
  uploadForm.value.file = file.raw
}

const cancelUpload = () => {
  showUploadDialog.value = false
  uploadForm.value = { name: '', type: 'source', description: '', file: null }
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const handleUpload = async () => {
  if (!uploadForm.value.name || !uploadForm.value.type || !uploadForm.value.file) {
    ElMessage.warning('请填写完整信息')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('name', uploadForm.value.name)
    formData.append('type', uploadForm.value.type)
    formData.append('description', uploadForm.value.description)

    const response = await routeTableApi.uploadExcel(formData)
    if (response.success) {
      ElMessage.success(response.message)
      showUploadDialog.value = false
      uploadForm.value = { name: '', type: 'source', description: '', file: null }
      // 清空文件选择器
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      loadTables()
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const createMigration = async () => {
  if (!migrationForm.value.name || !migrationForm.value.sourceTableId || !migrationForm.value.targetTableId) {
    ElMessage.warning('请填写完整信息')
    return
  }

  creating.value = true
  try {
    const response = await migrationApi.createSession({
      name: migrationForm.value.name,
      sourceTableId: migrationForm.value.sourceTableId,
      targetTableId: migrationForm.value.targetTableId,
      description: migrationForm.value.description
    })
    
    if (response.success) {
      ElMessage.success(response.message)
      showMigrationDialog.value = false
      migrationForm.value = { name: '', sourceTableId: null, targetTableId: null, description: '' }
      // 跳转到迁移页面
      router.push(`/route-migration/${response.data.id}`)
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '创建迁移会话失败')
  } finally {
    creating.value = false
  }
}

// 重新导入相关方法
const openReimportDialog = (table: RouteTable) => {
  currentTable.value = table
  showReimportDialog.value = true
  reimportForm.value.file = null
  reimportFileList.value = []
  // 清空文件选择器
  if (reimportUploadRef.value) {
    reimportUploadRef.value.clearFiles()
  }
}

const handleReimportFileChange = (file: any) => {
  reimportForm.value.file = file.raw
  reimportFileList.value = [file]
}

const cancelReimport = () => {
  showReimportDialog.value = false
  reimportForm.value = { file: null }
  reimportFileList.value = []
  if (reimportUploadRef.value) {
    reimportUploadRef.value.clearFiles()
  }
}

const handleReimport = async () => {
  if (!reimportForm.value.file) {
    ElMessage.warning('请选择Excel文件')
    return
  }

  if (!currentTable.value) {
    ElMessage.error('未选择要重新导入的表')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要重新导入"${currentTable.value.name}"吗？这将删除所有现有数据并替换为新文件的内容，此操作不可恢复！`,
      '确认重新导入',
      {
        type: 'warning',
        confirmButtonText: '确认导入',
        cancelButtonText: '取消'
      }
    )

    reimporting.value = true
    const formData = new FormData()
    formData.append('file', reimportForm.value.file)

    const response = await routeTableApi.reimportExcel(currentTable.value.id, formData)
    if (response.success) {
      ElMessage.success(`${response.message}，新记录数：${response.data.recordCount}`)
      showReimportDialog.value = false
      reimportForm.value = { file: null }
      reimportFileList.value = []
      // 清空文件选择器
      if (reimportUploadRef.value) {
        reimportUploadRef.value.clearFiles()
      }
      loadTables()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '重新导入失败')
    }
  } finally {
    reimporting.value = false
  }
}

const viewTable = (table: RouteTable) => {
  router.push(`/route-table/${table.id}`)
}

const exportTable = async (table: RouteTable) => {
  try {
    const blob = await migrationApi.exportTable(table.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${table.name}_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const deleteTable = async (table: RouteTable) => {
  try {
    await ElMessageBox.confirm(`确定要删除路由表"${table.name}"吗？`, '确认删除', {
      type: 'warning'
    })
    
    const response = await routeTableApi.deleteTable(table.id)
    if (response.success) {
      ElMessage.success(response.message)
      loadTables()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadTables()
})
</script>

<style scoped>
.route-table-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}
</style>
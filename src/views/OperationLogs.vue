<template>
  <div class="operation-logs-container">
    <div class="page-header">
      <h2>操作记录</h2>
      <!-- <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :shortcuts="dateShortcuts"
          @change="handleDateChange"
          style="width: 350px;"
        />
        <el-select v-model="filterType" placeholder="操作类型" clearable @change="handleTypeChange">
          <el-option label="全部" value="" />
          <el-option label="创建" value="CREATE" />
          <el-option label="更新" value="UPDATE" />
          <el-option label="删除" value="DELETE" />
          <el-option label="导入" value="IMPORT" />
          <el-option label="导出" value="EXPORT" />
        </el-select>
        <el-button type="primary" @click="fetchLogs">查询</el-button>
        <el-button v-if="props.showEditMenu" type="danger" @click="handleClearLogs">清空日志</el-button>
      </div> -->
      <div class="batch-actions" v-if="props.showEditMenu">
        <!-- <el-button type="primary" @click="toggleSelection">
          {{ isAllSelected ? '取消全选' : '全选' }}
        </el-button> -->
        <el-button type="danger" :disabled="selectedLogs.length === 0" @click="handleBatchDelete">
          批量删除 <span v-if="selectedLogs.length > 0">({{ selectedLogs.length }})</span>
        </el-button>
        <!-- <el-button type="warning" @click="handleClearLogs">清空日志</el-button> -->
      </div>
    </div>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="logs"
      style="width: 100%"
      border
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="operationType" label="操作类型" align="center" width="180">
        <template #default="scope">
          <el-tag :type="getTagType(scope.row.operationType)">
            {{ formatOperationType(scope.row.operationType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="对象名称" width="180">
        <template #default="scope">
          <span>{{ scope.row.targetName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作内容" show-overflow-tooltip>
        <template #default="scope">
          <span>{{ scope.row.operationContent }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="operatorIp" label="IP地址" align="center" width="180" />
      <el-table-column label="操作时间" width="200" align="center">
        <template #default="scope">
          {{ formatDateTime(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" v-if="props.showEditMenu">
        <template #default="scope">
          <el-button size="small" type="danger" @click="handleDeleteLog(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 清空日志确认对话框 -->
    <el-dialog
      v-model="clearLogsDialogVisible"
      title="清空日志"
      width="30%"
    >
      <div>
        <p>确定要清空所有日志吗？此操作不可恢复！</p>
        <el-date-picker
          v-model="clearBeforeDate"
          type="date"
          placeholder="清空此日期之前的日志"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%; margin-top: 20px;"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="clearLogsDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmClearLogs">确定清空</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { operationLogApi } from '../api';
import type { ElTable } from 'element-plus';

// 定义props
const props = defineProps<{
  showEditMenu: boolean
}>();

// 日志数据
const logs = ref<any[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const filterType = ref('');
const dateRange = ref<[string, string] | null>(null);
const clearBeforeDate = ref('');
const clearLogsDialogVisible = ref(false);
const selectedLogs = ref<number[]>([]);
const isAllSelected = ref(false);
const tableRef = ref<InstanceType<typeof ElTable>>();

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      return [start, end];
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
      return [start, end];
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
      return [start, end];
    },
  },
];

// 获取日志数据
const fetchLogs = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    };

    if (filterType.value) {
      params.operationType = filterType.value;
    }

    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }

    const response = await operationLogApi.getAllLogs(params);
    logs.value = response.data;
    total.value = response.total;
  } catch (error) {
    console.error('获取操作日志失败:', error);
    ElMessage.error('获取操作日志失败');
  } finally {
    loading.value = false;
  }
};

// 格式化操作类型
const formatOperationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    CREATE_CATEGORY: '创建分类',
    UPDATE_CATEGORY: '更新分类',
    DELETE_CATEGORY: '删除分类',
    CREATE_COMPONENT: '创建组件',
    UPDATE_COMPONENT: '更新组件',
    DELETE_COMPONENT: '删除组件',
    CREATE_DOC: '创建文档',
    UPDATE_DOC: '更新文档',
    DELETE_DOC: '删除文档',
    IMPORT_DOC: '导入文档',
    EXPORT_DOC: '导出文档'
  };
  return typeMap[type] || type;
};

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取标签类型
const getTagType = (type: string): string => {
  if (type.startsWith('CREATE')) return 'success';
  if (type.startsWith('UPDATE')) return 'warning';
  if (type.startsWith('DELETE')) return 'danger';
  if (type.startsWith('IMPORT')) return 'info';
  if (type.startsWith('EXPORT')) return '';
  return '';
};

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchLogs();
};

// 处理每页条数变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchLogs();
};

// 处理日期变化
const handleDateChange = (val: [string, string] | null) => {
  dateRange.value = val;
};

// 处理类型变化
const handleTypeChange = (val: string) => {
  filterType.value = val;
};

// 处理删除日志
const handleDeleteLog = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条日志记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    await operationLogApi.deleteLog(id);
    ElMessage.success('删除成功');
    fetchLogs();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除日志失败:', error);
      ElMessage.error('删除日志失败');
    }
  } finally {
    loading.value = false;
  }
};

// 处理清空日志
const handleClearLogs = () => {
  clearLogsDialogVisible.value = true;
};

// 确认清空日志
const confirmClearLogs = async () => {
  if (!clearBeforeDate.value) {
    ElMessage.warning('请选择日期');
    return;
  }

  try {
    loading.value = true;
    await operationLogApi.clearLogsBefore(clearBeforeDate.value);
    ElMessage.success('清空日志成功');
    clearLogsDialogVisible.value = false;
    fetchLogs();
  } catch (error) {
    console.error('清空日志失败:', error);
    ElMessage.error('清空日志失败');
  } finally {
    loading.value = false;
  }
};

// 处理选择变化
const handleSelectionChange = (val: any[]) => {
  selectedLogs.value = val.map(item => item.id);
  isAllSelected.value = val.length === logs.value.length;
};

// 处理批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除选中的日志记录吗？此操作不可恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    loading.value = true;
    await operationLogApi.batchDeleteLogs(selectedLogs.value);
    ElMessage.success('批量删除成功');
    fetchLogs();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除日志失败:', error);
      ElMessage.error('批量删除日志失败');
    }
  } finally {
    loading.value = false;
  }
};

// 处理全选/取消全选
const toggleSelection = () => {
  if (!tableRef.value) return;
  
  if (isAllSelected.value) {
    tableRef.value.clearSelection();
    isAllSelected.value = false;
  } else {
    logs.value.forEach(row => {
      tableRef.value?.toggleRowSelection(row, true);
    });
    isAllSelected.value = true;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.operation-logs-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.el-table {
  flex: 1;
  overflow: auto;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.batch-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style> 
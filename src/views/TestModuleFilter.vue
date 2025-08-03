<template>
  <div class="test-module-filter">
    <h2>模块筛选测试</h2>
    
    <el-card class="test-section">
      <h3>测试获取模块选项</h3>
      <el-input v-model="sessionId" placeholder="输入会话ID" style="width: 200px" />
      <el-button @click="testGetModules" :loading="loading1">获取模块列表</el-button>
      <pre v-if="result1">{{ JSON.stringify(result1, null, 2) }}</pre>
    </el-card>

    <el-card class="test-section">
      <h3>测试模块筛选</h3>
      <el-select v-model="selectedModule" placeholder="选择模块" clearable style="width: 200px">
        <el-option
          v-for="module in moduleOptions"
          :key="module"
          :label="module || '未分类'"
          :value="module"
        />
      </el-select>
      <el-button @click="testModuleFilter" :loading="loading2">测试筛选</el-button>
      <pre v-if="result2">{{ JSON.stringify(result2, null, 2) }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { migrationApi } from '../api/routeTable'

const sessionId = ref('1')
const selectedModule = ref('')
const moduleOptions = ref<string[]>([])
const loading1 = ref(false)
const loading2 = ref(false)
const result1 = ref(null)
const result2 = ref(null)

const testGetModules = async () => {
  loading1.value = true
  try {
    const response = await migrationApi.getModuleOptions(parseInt(sessionId.value))
    result1.value = response
    if (response.success) {
      moduleOptions.value = response.data
    }
  } catch (error: any) {
    result1.value = { error: error.message }
  } finally {
    loading1.value = false
  }
}

const testModuleFilter = async () => {
  loading2.value = true
  try {
    const response = await migrationApi.getComparisonData(parseInt(sessionId.value), {
      moduleFilter: selectedModule.value || undefined,
      pageSize: 10
    })
    result2.value = response
  } catch (error: any) {
    result2.value = { error: error.message }
  } finally {
    loading2.value = false
  }
}
</script>

<style scoped>
.test-module-filter {
  padding: 20px;
}

.test-section {
  margin-bottom: 20px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}
</style>
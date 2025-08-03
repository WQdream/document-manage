<template>
  <div class="test-route-api">
    <h2>路由表API测试</h2>
    
    <el-card class="test-section">
      <h3>测试获取路由表列表</h3>
      <el-button @click="testGetTables" :loading="loading1">获取路由表</el-button>
      <pre v-if="result1">{{ JSON.stringify(result1, null, 2) }}</pre>
    </el-card>

    <el-card class="test-section">
      <h3>测试获取迁移会话</h3>
      <el-button @click="testGetSessions" :loading="loading2">获取迁移会话</el-button>
      <pre v-if="result2">{{ JSON.stringify(result2, null, 2) }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { routeTableApi, migrationApi } from '../api/routeTable'

const loading1 = ref(false)
const loading2 = ref(false)
const result1 = ref(null)
const result2 = ref(null)

const testGetTables = async () => {
  loading1.value = true
  try {
    const response = await routeTableApi.getAllTables()
    result1.value = response
  } catch (error) {
    result1.value = { error: error.message }
  } finally {
    loading1.value = false
  }
}

const testGetSessions = async () => {
  loading2.value = true
  try {
    const response = await migrationApi.getSessions()
    result2.value = response
  } catch (error) {
    result2.value = { error: error.message }
  } finally {
    loading2.value = false
  }
}
</script>

<style scoped>
.test-route-api {
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
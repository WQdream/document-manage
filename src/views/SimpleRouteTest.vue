<template>
  <div class="simple-test">
    <h2>简单路由表测试</h2>
    <el-button @click="testLoad" :loading="loading">加载数据</el-button>
    
    <div v-if="error" style="color: red; margin: 10px 0;">
      错误: {{ error }}
    </div>
    
    <div v-if="tables.length > 0">
      <h3>找到 {{ tables.length }} 个路由表:</h3>
      <ul>
        <li v-for="table in tables" :key="table.id">
          ID: {{ table.id }}, 名称: {{ table.name }}, 类型: {{ table.type }}, 记录数: {{ table.recordCount }}
        </li>
      </ul>
    </div>
    
    <div v-else-if="!loading">
      <p>没有找到路由表数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { routeTableApi, type RouteTable } from '../api/routeTable'

const tables = ref<RouteTable[]>([])
const loading = ref(false)
const error = ref('')

const testLoad = async () => {
  loading.value = true
  error.value = ''
  tables.value = []
  
  try {
    console.log('开始测试加载...')
    const response = await routeTableApi.getAllTables()
    console.log('API响应:', response)
    console.log('响应类型:', typeof response)
    console.log('响应的success属性:', response?.success)
    console.log('响应的data属性:', response?.data)
    
    if (response && response.success) {
      tables.value = response.data || []
      console.log('成功设置数据:', tables.value)
    } else {
      error.value = `API返回失败: ${response?.message || '未知错误'}`
      console.log('API返回失败，完整响应:', response)
    }
  } catch (err: any) {
    console.error('请求异常:', err)
    error.value = `请求异常: ${err.message}`
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.simple-test {
  padding: 20px;
}
</style>
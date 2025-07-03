<template>
  <div class="layout-container">
    <el-container>
      <el-header class="header">
        <div class="logo">场景科技前端文档</div>
        <!-- <div class="nav-menu">
          <router-link to="/" class="nav-item">组件文档</router-link>
          <router-link to="/logs" class="nav-item">操作记录</router-link>
        </div> -->
        <el-button
          class="edit-toggle-btn"
          :icon="showEditMenu ? Hide : View"
          circle
          @click="toggleEditMenu"
          style="position: absolute; right: 30px; top: 16px;"
          :title="showEditMenu ? '隐藏编辑功能' : '显示编辑功能'"
        />
      </el-header>
      <el-container class="main-container">
        <router-view v-slot="{ Component }">
          <component :is="Component" :show-edit-menu="showEditMenu" />
        </router-view>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { View, Hide } from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';

// 编辑模式状态
const showEditMenu = ref(false);
function toggleEditMenu() {
  showEditMenu.value = !showEditMenu.value;
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.el-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.header {
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: relative;
  height: 60px;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 40px;
}

.nav-menu {
  display: flex;
  gap: 20px;
}

.nav-item {
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 0 10px;
  height: 60px;
  line-height: 60px;
  transition: background-color 0.3s;
}

.nav-item:hover, .router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
}

.edit-toggle-btn {
  position: absolute;
  right: 30px;
  top: 16px;
  z-index: 1000;
}
</style> 
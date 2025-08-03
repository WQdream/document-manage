<template>
  <el-container>
    <el-aside width="250px" class="sidebar">
      <div class="menu-header">
        <span>分类</span>
        <el-button 
          v-if="props.showEditMenu"
          type="primary" 
          size="small" 
          circle 
          @click="openAddCategoryDialog"
          title="添加分类"
        >
          <el-icon><plus /></el-icon>
        </el-button>
      </div>
      <el-menu
        :default-active="activeComponent"
        class="menu"
        @select="handleSelect"
      >
        <el-sub-menu v-for="category in categories" :key="category.id" :index="category.name">
          <template #title>
            <div class="category-title">
              <div class="category-name">
                <el-icon><document /></el-icon>
                <span>{{ category.name }}</span>
              </div>
              <div class="category-actions" v-if="props.showEditMenu">
                <el-tooltip content="添加组件" placement="top" :hide-after="1000">
                  <el-button 
                    type="primary" 
                    size="small" 
                    circle 
                    @click.stop="openAddComponentDialog(category.id)"
                    class="padding-left-10"
                  >
                    <el-icon><plus /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="编辑分类" placement="top" :hide-after="1000">
                  <el-button 
                    type="warning" 
                    size="small" 
                    circle 
                    @click.stop="openEditCategoryDialog(category)"
                    class="padding-left-10"
                  >
                    <el-icon><edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除分类" placement="top" :hide-after="1000">
                  <el-popconfirm 
                    title="确定删除此分类吗？" 
                    @confirm="deleteCategory(category.id)"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                  >
                    <template #reference>
                      <el-button 
                        type="danger" 
                        size="small" 
                        circle 
                        @click.stop
                        class="padding-left-10"
                      >
                        <el-icon><delete /></el-icon>
                      </el-button>
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </div>
            </div>
          </template>
          <el-menu-item 
            v-for="component in category.components" 
            :key="component.id"
            :index="component.componentId"
          >
            <div class="component-item">
              <span>{{ component.name }}</span>
              <div class="component-actions" v-if="props.showEditMenu">
                <el-tooltip content="编辑组件" placement="top" :hide-after="1000">
                  <el-button 
                    type="warning" 
                    size="small" 
                    circle 
                    @click.stop="openEditComponentDialog(component, category.id)"
                    class="padding-left-10"
                  >
                    <el-icon><edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除组件" placement="top" :hide-after="1000">
                  <el-popconfirm 
                    title="确定删除此组件吗？" 
                    @confirm="deleteComponent(component)"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                  >
                    <template #reference>
                      <el-button 
                        type="danger" 
                        size="small" 
                        circle 
                        @click.stop
                        class="padding-left-10"
                      >
                        <el-icon><delete /></el-icon>
                      </el-button>
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </div>
            </div>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-main class="main-content">
      <div v-if="!activeComponent" class="empty-state">
        <el-icon :size="64"><document /></el-icon>
        <p>请选择一个组件查看文档</p>
      </div>
      <component-doc v-else :component-id="activeComponent" :show-edit-menu="props.showEditMenu" />
    </el-main>
  </el-container>

  <!-- 分类对话框 -->
  <el-dialog
    v-model="categoryDialogVisible"
    :title="dialogMode === 'add' ? '添加分类' : '编辑分类'"
    width="30%"
    destroy-on-close
  >
    <el-form
      ref="categoryFormRef"
      :model="categoryForm"
      :rules="categoryRules"
      label-width="80px"
    >
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="categoryForm.name" placeholder="请输入分类名称"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCategoryForm">确定</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 组件对话框 -->
  <el-dialog
    v-model="componentDialogVisible"
    :title="dialogMode === 'add' ? '添加组件' : '编辑组件'"
    width="30%"
    destroy-on-close
  >
    <el-form
      ref="componentFormRef"
      :model="componentForm"
      :rules="componentRules"
      label-width="80px"
    >
      <el-form-item label="组件名称" prop="name">
        <el-input v-model="componentForm.name" placeholder="请输入组件名称"></el-input>
      </el-form-item>
      <!-- 仅在编辑模式下显示组件ID（只读） -->
      <el-form-item v-if="dialogMode === 'edit'" label="组件ID">
        <el-input 
          v-model="componentForm.componentId" 
          disabled
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="componentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComponentForm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Document, Plus, Edit, Delete
} from '@element-plus/icons-vue';
import ComponentDoc from '../components/ComponentDoc.vue';
import { categoryApi, componentApi } from '../api';

// 定义props
const props = defineProps<{
  showEditMenu: boolean
}>();

// 当前选中的组件
const activeComponent = ref('');

// 组件分类
const categories = ref<any[]>([]);

// 加载状态
const loading = ref(false);

// 对话框状态
const categoryDialogVisible = ref(false);
const componentDialogVisible = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');

// 当前编辑的分类ID
const currentCategoryId = ref<number | null>(null);

// 表单数据
const categoryForm = reactive({
  name: ''
});

const componentForm = reactive({
  name: '',
  componentId: '',
  categoryId: null as number | null
});

// 表单规则
const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
};

const componentRules = {
  name: [
    { required: true, message: '请输入组件名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
};

// 表单引用
const categoryFormRef = ref();
const componentFormRef = ref();

// 生成组件ID
const generateComponentId = (name: string): string => {
  // 移除非字母数字字符，并将空格替换为连字符
  let id = name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  
  // 确保以字母开头
  if (!/^[a-zA-Z]/.test(id)) {
    id = 'comp-' + id;
  }
  
  // 添加时间戳后缀确保唯一性
  id += '-' + Date.now().toString().slice(-6);
  
  return id;
};

// 获取菜单数据
const fetchMenuData = async () => {
  loading.value = true;
  try {
    const response = await categoryApi.getMenuStructure();
    categories.value = response;
    // 如果有组件，默认选中第一个组件
    if (categories.value.length > 0 && categories.value[0].components.length > 0) {
      activeComponent.value = categories.value[0].components[0].componentId;
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error);
    ElMessage.error('获取菜单数据失败');
  } finally {
    loading.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchMenuData();
});

// 切换组件
const handleSelect = (key: string) => {
  activeComponent.value = key;
};

// 打开添加分类对话框
const openAddCategoryDialog = () => {
  dialogMode.value = 'add';
  categoryForm.name = '';
  categoryDialogVisible.value = true;
};

// 打开编辑分类对话框
const openEditCategoryDialog = (category: any) => {
  dialogMode.value = 'edit';
  currentCategoryId.value = category.id;
  categoryForm.name = category.name;
  categoryDialogVisible.value = true;
};

// 打开添加组件对话框
const openAddComponentDialog = (categoryId: number) => {
  dialogMode.value = 'add';
  componentForm.name = '';
  componentForm.componentId = '';
  componentForm.categoryId = categoryId;
  componentDialogVisible.value = true;
};

// 打开编辑组件对话框
const openEditComponentDialog = (component: any, categoryId: number) => {
  dialogMode.value = 'edit';
  componentForm.name = component.name;
  componentForm.componentId = component.componentId;
  componentForm.categoryId = categoryId;
  componentDialogVisible.value = true;
};

// 提交分类表单
const submitCategoryForm = async () => {
  if (!categoryFormRef.value) return;
  
  await categoryFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true;
        if (dialogMode.value === 'add') {
          await categoryApi.createCategory({ name: categoryForm.name });
          ElMessage.success('添加分类成功');
        } else {
          await categoryApi.updateCategory(currentCategoryId.value!, { name: categoryForm.name });
          ElMessage.success('更新分类成功');
        }
        categoryDialogVisible.value = false;
        await fetchMenuData();
      } catch (error) {
        console.error('操作分类失败:', error);
        ElMessage.error('操作失败，请重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 提交组件表单
const submitComponentForm = async () => {
  if (!componentFormRef.value) return;
  
  await componentFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true;
        
        // 添加组件时自动生成组件ID
        if (dialogMode.value === 'add') {
          componentForm.componentId = generateComponentId(componentForm.name);
          
          await componentApi.createComponent({
            name: componentForm.name,
            componentId: componentForm.componentId,
            categoryId: componentForm.categoryId
          });
          ElMessage.success('添加组件成功');
        } else {
          // 获取组件ID
          const response = await componentApi.getComponentByComponentId(componentForm.componentId);
          const componentId = response.id;
          
          await componentApi.updateComponent(componentId, {
            name: componentForm.name,
            componentId: componentForm.componentId,
            categoryId: componentForm.categoryId
          });
          ElMessage.success('更新组件成功');
        }
        componentDialogVisible.value = false;
        await fetchMenuData();
      } catch (error) {
        console.error('操作组件失败:', error);
        ElMessage.error('操作失败，请重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 删除分类
const deleteCategory = async (categoryId: number) => {
  try {
    loading.value = true;
    await categoryApi.deleteCategory(categoryId);
    ElMessage.success('删除分类成功');
    await fetchMenuData();
    
    // 如果当前选中的组件属于被删除的分类，清空选中
    if (!categories.value.some(category => 
      category.components.some((comp: any) => comp.componentId === activeComponent.value)
    )) {
      activeComponent.value = '';
    }
  } catch (error: any) {
    console.error('删除分类失败:', error.response?.data?.message || error);
    if (error.response?.data?.message) {
      ElMessage.warning(error.response.data.message);
    } else {
      ElMessage.error('删除失败，请重试');
    }
  } finally {
    loading.value = false;
  }
};

// 删除组件
const deleteComponent = async (component: any) => {
  try {
    loading.value = true;
    // 获取组件ID
    const response = await componentApi.getComponentByComponentId(component.componentId);
    const componentId = response.id;
    
    await componentApi.deleteComponent(componentId);
    ElMessage.success('删除组件成功');
    
    // 如果删除的是当前选中的组件，清空选中
    if (component.componentId === activeComponent.value) {
      activeComponent.value = '';
    }
    
    await fetchMenuData();
  } catch (error: any) {
    console.error('删除组件失败:', error.response?.data?.message || error);
    if (error.response?.data?.message) {
      ElMessage.warning(error.response.data.message);
    } else {
      ElMessage.error('删除失败，请重试');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.sidebar {
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
}

.menu-header span {
  font-weight: bold;
  font-size: 16px;
}

.menu {
  height: 100%;
  border-right: none;
  overflow-y: auto;
}

.category-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.category-name {
  display: flex;
  align-items: center;
}

.category-actions, .component-actions {
  display: flex;
  gap: 5px;
  opacity: 0.2;
  transition: opacity 0.3s;
}

.el-sub-menu__title:hover .category-actions,
.component-item:hover .component-actions {
  opacity: 1;
}

.component-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.main-content {
  padding: 20px;
  overflow-y: auto;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-state p {
  margin-top: 16px;
  font-size: 16px;
}

.el-container {
  height: 100%;
}

.padding-left-10{
  padding-left: 10px;
}
</style> 
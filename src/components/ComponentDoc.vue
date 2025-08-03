<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { ElButton, ElMessage, ElSwitch, ElLoading } from 'element-plus';
import { Edit, Download, Upload, DocumentDelete } from '@element-plus/icons-vue';
import { componentDocApi } from '../api';
import { MdEditor, MdPreview, MdCatalog } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';

// 引入v-loading指令
const vLoading = ElLoading.directive;

// 定义类型
interface Prop {
  name: string;
  type: string;
  default: string;
  description: string;
}

interface Event {
  name: string;
  description: string;
  params: string;
}

interface Example {
  title: string;
  description: string;
  code: string;
}

interface DocData {
  id?: number;
  title: string;
  description: string;
  usage: string;
  props: Prop[];
  events: Event[];
  examples: Example[];
  markdownContent?: string;
}

// 接收组件ID作为属性
const props = defineProps<{
  componentId: string,
  showEditMenu: boolean
}>();

// 编辑模式状态
const isEditMode = ref(false);

// 监听showEditMenu变化，当隐藏编辑按钮时自动切换到查看模式
watch(() => props.showEditMenu, (newValue) => {
  if (!newValue) {
    isEditMode.value = false;
  }
});

// 加载状态
const loading = ref(false);

// 当前文档数据
const docData = ref<DocData | null>(null);

// 文档获取失败状态
const docFetchFailed = ref(false);

// 当前编辑的文档内容
const editableDoc = ref<DocData>({
  title: '',
  description: '',
  usage: '',
  props: [],
  events: [],
  examples: []
});

// 原始Markdown文本
const markdownText = ref('');

// 文件输入引用
const fileInput = ref<HTMLInputElement | null>(null);

// 添加对预览组件的引用
const mdPreviewRef = ref<any>(null);
const mdEditorRef = ref<any>(null);

// 目录状态
const showCatalog = ref(true);
const catalogWidth = ref(250);
const catalogPosition = ref({ top: 120, right: 20 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

// 用于强制重新渲染目录
const catalogKey = ref(0);

// 用于生成唯一ID
const uniqueId = ref(Date.now().toString());

// 获取组件文档
const fetchComponentDoc = async (componentId: string) => {
  if (!componentId) return;
  
  loading.value = true;
  docFetchFailed.value = false;
  try {
    const response = await componentDocApi.getDocByComponentId(componentId);
    docData.value = response;
    
    // 复制文档数据到可编辑对象
    if (docData.value) {
      editableDoc.value = JSON.parse(JSON.stringify(docData.value));
      
      // 设置Markdown文本
      if (docData.value.markdownContent) {
        markdownText.value = docData.value.markdownContent;
      } else {
        // 没有原始Markdown内容时生成
        generateMarkdownText();
      }
    }
  } catch (error) {
    console.error('获取组件文档失败:', error);
    // ElMessage.error('获取组件文档失败');
    docFetchFailed.value = true;
    
    // 设置空文档
    docData.value = {
      title: '未找到组件',
      description: '没有找到该组件的文档',
      usage: '',
      props: [],
      events: [],
      examples: [],
      markdownContent: ''
    };
    editableDoc.value = JSON.parse(JSON.stringify(docData.value));
  } finally {
    loading.value = false;
  }
};

// 根据组件ID获取对应的文档
const currentDoc = computed((): DocData => {
  return docData.value || {
    title: '未找到组件',
    description: '没有找到该组件的文档',
    usage: '',
    props: [],
    events: [],
    examples: [],
    markdownContent: ''
  };
});


// 生成Markdown文本
const generateMarkdownText = () => {
  const doc = editableDoc.value;
  let md = `# ${doc.title}\n\n`;
  md += `${doc.description}\n\n`;
  md += `## 使用场景\n\n${doc.usage}\n\n`;
  
  md += `## 属性\n\n`;
  md += `| 属性名 | 类型 | 默认值 | 说明 |\n`;
  md += `| ------ | ---- | ------ | ---- |\n`;
  doc.props.forEach(prop => {
    md += `| ${prop.name} | ${prop.type} | ${prop.default} | ${prop.description} |\n`;
  });
  md += '\n';
  
  md += `## 事件\n\n`;
  md += `| 事件名 | 说明 | 参数 |\n`;
  md += `| ------ | ---- | ---- |\n`;
  doc.events.forEach(event => {
    md += `| ${event.name} | ${event.description} | ${event.params} |\n`;
  });
  md += '\n';
  
  md += `## 示例\n\n`;
  doc.examples.forEach(example => {
    md += `### ${example.title}\n\n`;
    md += `${example.description}\n\n`;
    md += '```html\n';
    md += `${example.code}\n`;
    md += '```\n\n';
  });
  
  markdownText.value = md;
};

// 滚动文档到顶部
const scrollToTop = () => {
  setTimeout(() => {
    // 使用ref获取预览组件，并滚动到顶部
    if (mdPreviewRef.value) {
      const previewElement = mdPreviewRef.value.$el.querySelector('.md-preview-wrapper');
      if (previewElement) {
        previewElement.scrollTop = 0;
      }
    }
    
    // 使用ref获取编辑器组件，并滚动预览区域到顶部
    if (mdEditorRef.value) {
      const editorPreview = mdEditorRef.value.$el.querySelector('.md-editor-preview-wrapper');
      if (editorPreview) {
        editorPreview.scrollTop = 0;
      }
    }
    
    // 备用方法：直接查询DOM
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
      previewContainer.scrollTop = 0;
    }
    
    const editorPreview = document.querySelector('.md-editor-preview-wrapper');
    if (editorPreview) {
      editorPreview.scrollTop = 0;
    }
    
    // 重置目录滚动位置
    const catalogList = document.querySelector('.md-catalog-list');
    if (catalogList) {
      catalogList.scrollTop = 0;
    }
    
    // 重置目录选中项
    const activeItems = document.querySelectorAll('.md-catalog-item-active');
    activeItems.forEach(item => {
      item.classList.remove('md-catalog-item-active');
    });
    
    // 选中第一个目录项
    const firstItem = document.querySelector('.md-catalog-item');
    if (firstItem) {
      firstItem.classList.add('md-catalog-item-active');
      
      // 模拟点击第一个标题，使预览区域滚动到顶部
      (firstItem as HTMLElement).click();
    }
  }, 100);
};

// 处理目录拖动
const startDrag = (e: MouseEvent) => {
  if (e.target && (e.target as HTMLElement).closest('.catalog-header')) {
    isDragging.value = true;
    const catalogEl = document.querySelector('.floating-catalog');
    if (catalogEl) {
      const rect = catalogEl.getBoundingClientRect();
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    
    // 添加全局事件监听
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  }
};

const onDrag = (e: MouseEvent) => {
  if (isDragging.value) {
    const x = e.clientX - dragOffset.value.x;
    const y = e.clientY - dragOffset.value.y;
    
    // 计算right值（从窗口右侧到目录右侧的距离）
    const windowWidth = window.innerWidth;
    const right = windowWidth - x - catalogWidth.value;
    
    catalogPosition.value = {
      top: Math.max(60, y), // 保持在顶部以下
      right: Math.max(10, right) // 保持在右侧可见
    };
  }
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// 手动触发目录更新
const updateCatalog = () => {
  // 延迟执行，确保预览组件已完全渲染
  setTimeout(() => {
    // 尝试查找目录组件并触发更新
    const catalogEl = document.querySelector('.md-catalog');
    if (catalogEl) {
      // 尝试手动触发目录更新
      const event = new CustomEvent('update-catalog', { detail: { componentId: props.componentId } });
      catalogEl.dispatchEvent(event);
      
      // 尝试触发滚动事件，有些组件会在滚动时更新目录
      const previewEl = document.querySelector('.md-preview-wrapper');
      if (previewEl) {
        previewEl.dispatchEvent(new Event('scroll'));
      }
      
      // 重置目录滚动位置到顶部
      const catalogList = document.querySelector('.md-catalog-list');
      if (catalogList) {
        catalogList.scrollTop = 0;
      }
      
      // 重置目录选中项
      const activeItems = document.querySelectorAll('.md-catalog-item-active');
      activeItems.forEach(item => {
        item.classList.remove('md-catalog-item-active');
      });
      
      // 选中第一个目录项
      const firstItem = document.querySelector('.md-catalog-item');
      if (firstItem) {
        firstItem.classList.add('md-catalog-item-active');
        
        // 模拟点击第一个标题，使预览区域滚动到顶部
        (firstItem as HTMLElement).click();
      }
    }
  }, 500);
};

// 监听组件ID变化，获取组件文档
watch(() => props.componentId, (newComponentId) => {
  // 切换组件时，退出编辑模式
  isEditMode.value = false;
  docFetchFailed.value = false;
  
  if (newComponentId) {
    // 先隐藏目录
    showCatalog.value = false;
    
    // 生成新的唯一ID
    uniqueId.value = Date.now().toString();
    
    // 获取文档内容
    fetchComponentDoc(newComponentId);
    scrollToTop();
    
    // 重置目录位置
    catalogPosition.value = { top: 120, right: 20 };
    
    // 立即重置所有目录相关的状态
    nextTick(() => {
      // 重置目录滚动位置
      const catalogList = document.querySelector('.md-catalog-list');
      if (catalogList) {
        catalogList.scrollTop = 0;
      }
      
      // 重置目录选中项
      const activeItems = document.querySelectorAll('.md-catalog-item-active');
      activeItems.forEach(item => {
        item.classList.remove('md-catalog-item-active');
      });
    });
    
    // 使用更长的延迟确保文档内容已完全加载和渲染
    setTimeout(() => {
      // 重新显示目录
      showCatalog.value = true;
      
      // 手动触发目录更新
      nextTick(() => {
        updateCatalog();
      });
    }, 200); // 使用更长的延迟
  }
}, { immediate: true });

// 监听编辑模式变化，切换时滚动到顶部
watch(() => isEditMode.value, () => {
  scrollToTop();
});

// 监听文档内容变化，更新目录
watch(() => currentDoc.value.markdownContent, () => {
  if (showCatalog.value) {
    nextTick(() => {
      updateCatalog();
    });
  }
});

// 组件挂载时获取数据
onMounted(() => {
  if (props.componentId) {
    fetchComponentDoc(props.componentId);
  }
});

// 从Markdown文本解析文档
const parseMarkdownText = (text: string): DocData | null => {
  try {
    const doc: DocData = {
      title: '',
      description: '',
      usage: '',
      props: [],
      events: [],
      examples: []
    };
    
    // 简单的解析逻辑，实际应用中可能需要更复杂的解析器
    const lines = text.split('\n');
    let section = '';
    let example: Example | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ')) {
        doc.title = line.substring(2);
      } else if (line.startsWith('## 使用场景')) {
        section = 'usage';
      } else if (line.startsWith('## 属性')) {
        section = 'props';
        i += 2; // 跳过表头和分隔行
      } else if (line.startsWith('## 事件')) {
        section = 'events';
        i += 2; // 跳过表头和分隔行
      } else if (line.startsWith('## 示例')) {
        section = 'examples';
      } else if (line.startsWith('### ') && section === 'examples') {
        if (example) {
          doc.examples.push(example);
        }
        example = {
          title: line.substring(4),
          description: '',
          code: ''
        };
      } else if (line.startsWith('```html') && section === 'examples' && example) {
        let code = '';
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          code += lines[i] + '\n';
          i++;
        }
        example.code = code.trim();
      } else if (section === 'usage' && !line.startsWith('##')) {
        doc.description = doc.description || line; // 第一行非标题文本作为描述
        if (line && !line.startsWith('#')) {
          doc.usage += line + '\n';
        }
      } else if (section === 'props' && line.startsWith('|') && !line.startsWith('| --')) {
        const parts = line.split('|').filter(p => p.trim()).map(p => p.trim());
        if (parts.length >= 4) {
          doc.props.push({
            name: parts[0],
            type: parts[1],
            default: parts[2],
            description: parts[3]
          });
        }
      } else if (section === 'events' && line.startsWith('|') && !line.startsWith('| --')) {
        const parts = line.split('|').filter(p => p.trim()).map(p => p.trim());
        if (parts.length >= 3) {
          doc.events.push({
            name: parts[0],
            description: parts[1],
            params: parts[2]
          });
        }
      } else if (section === 'examples' && example && !line.startsWith('```') && !line.startsWith('###')) {
        if (line) {
          example.description += line + '\n';
        }
      }
    }
    
    // 添加最后一个示例
    if (example) {
      doc.examples.push(example);
    }
    
    // 清理描述和用法中的多余换行
    doc.description = doc.description.trim();
    doc.usage = doc.usage.trim();
    doc.examples.forEach(ex => {
      ex.description = ex.description.trim();
    });
    
    return doc;
  } catch (error) {
    console.error('解析Markdown失败:', error);
    ElMessage.error('解析Markdown失败，请检查格式');
    return null;
  }
};

// 保存编辑内容
const saveChanges = async () => {
  loading.value = true;
  try {
    const dataToSave = { ...editableDoc.value };
    
    // 设置Markdown内容
    dataToSave.markdownContent = markdownText.value;
    
    // 如果文档已存在，则更新；否则创建新文档
    if (docData.value && docData.value.id) {
      await componentDocApi.updateDoc(docData.value.id, dataToSave);
    } else {
      // 创建新文档时需要关联组件ID
      await componentDocApi.createDoc({
        ...dataToSave,
        componentId: props.componentId
      });
    }
    
    // 重新获取文档数据
    await fetchComponentDoc(props.componentId);
    isEditMode.value = false;
    ElMessage.success('保存成功');
  } catch (error) {
    console.error('保存文档失败:', error);
    ElMessage.error('保存文档失败');
  } finally {
    loading.value = false;
  }
};

// 取消编辑
const cancelEdit = () => {
  // 恢复原始数据
  editableDoc.value = JSON.parse(JSON.stringify(docData.value || {}));
  
  // 恢复原始Markdown文本
  if (docData.value && docData.value.markdownContent) {
    markdownText.value = docData.value.markdownContent;
  } else {
    generateMarkdownText();
  }
  
  isEditMode.value = false;
};

// 导出为Markdown文件
const exportMarkdown = async () => {
  loading.value = true;
  try {
    // 使用API导出Markdown
    // const response = await componentDocApi.exportMarkdown(props.componentId);
    if(!docData.value || !docData.value.id){
      throw new Error('组件文档不存在');
    }
    const response = await componentDocApi.exportMarkdown(String(docData.value.id));
    // 创建下载链接
    const blob = new Blob([response], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.value.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出Markdown失败:', error);
    ElMessage.error('导出Markdown失败');
    
    // 如果API导出失败，使用本地生成的Markdown作为备选
    const blob = new Blob([markdownText.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.value.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    loading.value = false;
  }
};

// 触发文件选择
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 导入Markdown文件
const importMarkdown = (event: { target: HTMLInputElement }) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  loading.value = true;
  const reader = new FileReader();
  reader.onload = async (e: ProgressEvent<FileReader>) => {
    try {
      const result = e.target?.result;
      if (typeof result !== 'string') return;
      
      const text = result;
      markdownText.value = text;
      
      // 使用API导入Markdown
      if (props.componentId) {
        await componentDocApi.importMarkdown(props.componentId, text);
        await fetchComponentDoc(props.componentId);
        
        ElMessage.success('导入成功');
      } else {
        // 如果没有组件ID，则只更新本地文本
        markdownText.value = text;
        ElMessage.success('导入成功');
      }
    } catch (error) {
      console.error('导入Markdown失败:', error);
      ElMessage.error('导入Markdown失败');
      
      // 如果API导入失败，至少在本地显示内容
      if (e.target?.result && typeof e.target.result === 'string') {
        markdownText.value = e.target.result;
      }
    } finally {
      loading.value = false;
    }
  };
  reader.readAsText(file);
  // 重置文件输入，允许选择相同文件
  event.target.value = '';
};

// 更新Markdown内容
const handleEditorChange = (content: string) => {
  markdownText.value = content;
};

// 从Markdown内容中提取标题结构
const extractHeaders = (content: string) => {
  const lines = content.split('\n');
  const headers = [];
  const headerRegex = /^(#{1,6})\s+(.+)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(headerRegex);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headers.push({ level, text, line: i + 1 });
    }
  }
  
  return headers;
};

// 计算文档的标题结构
const documentHeaders = computed(() => {
  const content = currentDoc.value.markdownContent || markdownText.value;
  return content ? extractHeaders(content) : [];
});

// 切换目录显示
const toggleCatalog = () => {
  showCatalog.value = !showCatalog.value;
  
  // 如果显示目录，确保选中第一个标题
  if (showCatalog.value) {
    nextTick(() => {
      // 重置目录滚动位置
      const catalogList = document.querySelector('.md-catalog-list');
      if (catalogList) {
        catalogList.scrollTop = 0;
      }
      
      // 重置目录选中项
      const activeItems = document.querySelectorAll('.md-catalog-item-active');
      activeItems.forEach(item => {
        item.classList.remove('md-catalog-item-active');
      });
      
      // 选中第一个目录项
      const firstItem = document.querySelector('.md-catalog-item');
      if (firstItem) {
        firstItem.classList.add('md-catalog-item-active');
        
        // 模拟点击第一个标题，使预览区域滚动到顶部
        (firstItem as HTMLElement).click();
      }
    });
  }
};
</script>

<template>
  <div class="component-doc" v-loading="loading">
    <!-- 文档获取失败时显示的缺省页面 -->
    <div v-if="docFetchFailed && !isEditMode" class="doc-empty-state">
      <el-icon :size="64"><DocumentDelete /></el-icon>
      <h2>暂无内容</h2>
      <p>请重新导入</p>
      <div class="empty-actions">
        <el-button type="warning" icon="Upload" @click="triggerFileInput">导入 Markdown</el-button>
        <!-- <el-button type="primary" icon="Edit" @click="isEditMode = true">编辑</el-button> -->
      </div>
      <input 
        type="file" 
        ref="fileInput" 
        @change="importMarkdown($event as any)" 
        accept=".md,.markdown,text/markdown" 
        style="display: none"
      >
    </div>

    <!-- 编辑模式 - 使用md-editor-v3 -->
    <div v-else-if="isEditMode" class="editor-container">
      <div class="doc-header">
        <div class="doc-title-container">
          <h1 class="doc-title">{{ editableDoc.title }}</h1>
          <div class="doc-actions">
            <el-button type="success" @click="saveChanges">保存</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </div>
        </div>
      </div>
      <MdEditor
        ref="mdEditorRef"
        :modelValue="markdownText"
        @onChange="handleEditorChange"
        language="zh-CN"
        :toolbarsExclude="['github']"
        previewTheme="vuepress"
        style="height: calc(100vh - 200px)"
        defaultShowPreview
      />
    </div>

    <!-- 正常文档内容 -->
    <template v-else>
      <div class="doc-header">
        <div class="doc-title-container">
          <h1 class="doc-title">{{ currentDoc.component?currentDoc.component.name:'' }}</h1>
          <div class="doc-actions">
            <!-- 编辑相关按钮，根据showEditMenu显示或隐藏 -->
            <template v-if="props.showEditMenu">
              <el-switch
                v-model="isEditMode"
                active-text="编辑模式"
                inactive-text="查看模式"
                class="edit-switch"
              />
              <el-button type="primary" icon="Edit" @click="isEditMode = true" v-if="!isEditMode">编辑</el-button>
              <template v-else>
                <el-button type="success" @click="saveChanges">保存</el-button>
                <el-button @click="cancelEdit">取消</el-button>
              </template>
              <el-button type="info" icon="Download" @click="exportMarkdown">导出 Markdown</el-button>
              <el-button type="warning" icon="Upload" @click="triggerFileInput">导入 Markdown</el-button>
              <input 
                type="file" 
                ref="fileInput" 
                @change="importMarkdown($event as any)" 
                accept=".md,.markdown,text/markdown" 
                style="display: none"
              >
            </template>
          </div>
        </div>
      </div>
      
      <!-- 查看模式 - 使用MdPreview纯预览组件 -->
      <div class="doc-view-container">
        <!-- 预览区域 -->
        <div class="preview-container">
          <MdPreview
            ref="mdPreviewRef"
            :modelValue="currentDoc.markdownContent || markdownText"
            language="zh-CN"
            previewTheme="vuepress"
            style="height: calc(100vh - 200px); padding: 20px;"
            :editorId="`preview-${props.componentId}-${uniqueId}`"
            :key="`preview-${props.componentId}-${uniqueId}`"
            :noKatex="true"
            :noMermaid="true"
            :codeHighlightExtensionMap="{}"
          />
        </div>
        
        <!-- 悬浮目录区域 -->
        <div 
          v-if="showCatalog" 
          class="floating-catalog"
          :style="{
            top: `${catalogPosition.top}px`,
            right: `${catalogPosition.right}px`,
            width: `${catalogWidth}px`
          }"
          @mousedown="startDrag"
        >
          <div class="catalog-header">
            <span>目录</span>
            <el-button 
              :text="true"
              size="small" 
              @click="toggleCatalog"
              style="padding: 0; color: #409EFF;"
            >
              关闭
            </el-button>
          </div>
          <!-- 使用组件ID和唯一ID作为key，强制在组件切换时重新创建目录组件 -->
          <MdCatalog 
            v-if="props.componentId"
            :key="`${props.componentId}-${uniqueId}`"
            :editorId="`preview-${props.componentId}-${uniqueId}`"
            :scrollElement="preview-container"
            :scrollElementOffsetTop="20"
          />
        </div>
        
        <!-- 悬浮目录切换按钮 -->
        <div 
          v-if="!showCatalog" 
          class="catalog-toggle-btn"
          :style="{
            top: `${catalogPosition.top}px`,
            right: `${catalogPosition.right}px`
          }"
        >
          <el-button 
            type="primary" 
            size="small" 
            @click="toggleCatalog" 
            circle
            title="显示目录"
          >
            <el-icon class="catalog-icon">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                <path fill="currentColor" d="M160 192h128v128H160zm0 256h128v128H160zm0 256h128v128H160zm320-512h384v128H480zm0 256h384v128H480zm0 256h384v128H480z"></path>
              </svg>
            </el-icon>
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.component-doc {
  max-width: 100%;
  margin: 0 auto;
  position: relative;
}

.doc-header {
  margin-bottom: 1rem;
}

.doc-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.doc-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.doc-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #303133;
  margin-right: 1rem;
}

.edit-switch {
  margin-right: 15px;
}

.editor-container, .preview-container {
  border-radius: 4px;
  overflow: hidden;
}

/* 悬浮目录样式 */
.floating-catalog {
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e6e6e6;
  max-height: 70vh;
  transition: box-shadow 0.3s;
}

.floating-catalog:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

/* 目录切换按钮 */
.catalog-toggle-btn {
  position: fixed;
  z-index: 100;
}

.catalog-icon {
  font-size: 16px;
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  font-weight: bold;
  cursor: move;
}

/* 移除md-editor-v3默认边框 */
:deep(.md-editor) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

:deep(.md-editor-preview-wrapper) {
  padding: 16px 24px;
}

/* 纯预览模式样式 */
:deep(.md-preview-wrapper) {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 自定义目录样式 */
:deep(.md-catalog-wrapper) {
  max-height: calc(70vh - 40px);
  overflow-y: auto;
}

:deep(.md-catalog-item) {
  cursor: pointer;
  transition: color 0.2s;
}

:deep(.md-catalog-item:hover) {
  color: #409EFF;
}

:deep(.md-catalog-item-active) {
  color: #409EFF !important;
}

/* 缺省页面样式 */
.doc-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 200px);
  color: #909399;
  text-align: center;
}

.doc-empty-state h2 {
  margin-top: 20px;
  font-size: 24px;
  font-weight: 500;
  color: #606266;
}

.doc-empty-state p {
  margin-top: 16px;
  font-size: 16px;
  max-width: 500px;
}

.empty-actions {
  margin-top: 24px;
  display: flex;
  gap: 16px;
}
</style>
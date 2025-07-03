# 组件文档系统

这是一个基于Vue3和Element Plus的组件文档系统，用于展示和说明各种UI组件的使用方法、属性、事件和示例代码。

## 功能特点

- 基于Vue3和TypeScript开发
- 使用Element Plus作为UI组件库
- 支持Markdown渲染
- 代码高亮显示
- 组件分类展示
- 详细的组件属性、事件说明
- 丰富的示例代码

## 项目结构

```
├── public/             # 静态资源
├── src/                # 源代码
│   ├── assets/         # 资源文件
│   ├── components/     # 组件
│   │   ├── ComponentDoc.vue  # 组件文档展示组件
│   │   └── ...         # 其他组件
│   ├── App.vue         # 主应用组件
│   ├── main.ts         # 入口文件
│   └── style.css       # 全局样式
├── index.html          # HTML模板
└── package.json        # 项目配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 如何添加新组件文档

在`ComponentDoc.vue`文件中的`componentDocs`对象中添加新的组件文档信息，格式如下：

```typescript
componentId: {
  title: '组件名称',
  description: '组件描述',
  usage: '使用场景',
  props: [
    { name: '属性名', type: '类型', default: '默认值', description: '说明' },
    // 更多属性...
  ],
  events: [
    { name: '事件名', description: '说明', params: '参数' },
    // 更多事件...
  ],
  examples: [
    {
      title: '示例标题',
      description: '示例描述',
      code: `示例代码`,
    },
    // 更多示例...
  ],
}
```

然后在`App.vue`的`categories`数组中添加对应的组件分类和链接。

## 自定义主题

可以通过修改`style.css`和组件中的样式来自定义主题。

## 许可证

MIT

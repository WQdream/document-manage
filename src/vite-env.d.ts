/// <reference types="vite/client" />

declare module 'markdown-it' {
  export default class MarkdownIt {
    constructor(options?: any);
    render(text: string): string;
    use(plugin: any, ...params: any[]): MarkdownIt;
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

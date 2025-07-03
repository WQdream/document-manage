import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import OperationLogs from '../views/OperationLogs.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'logs',
        name: 'OperationLogs',
        component: OperationLogs
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 
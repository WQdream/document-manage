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
      },
      {
        path: 'route-manager',
        name: 'RouteTableManager',
        component: () => import('../views/RouteTableManager.vue')
      },
      {
        path: 'route-table/:id',
        name: 'RouteTableDetail',
        component: () => import('../views/RouteTableDetail.vue')
      },
      {
        path: 'route-migration/:id',
        name: 'RouteMigration',
        component: () => import('../views/RouteMigration.vue')
      },
      {
        path: 'migration-sessions',
        name: 'MigrationSessions',
        component: () => import('../views/MigrationSessions.vue')
      },
      {
        path: 'test-route-api',
        name: 'TestRouteApi',
        component: () => import('../views/TestRouteApi.vue')
      },
      {
        path: 'simple-route-test',
        name: 'SimpleRouteTest',
        component: () => import('../views/SimpleRouteTest.vue')
      },
      {
        path: 'test-module-filter',
        name: 'TestModuleFilter',
        component: () => import('../views/TestModuleFilter.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 
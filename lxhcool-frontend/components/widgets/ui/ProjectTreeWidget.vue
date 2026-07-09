<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';
import ProjectTreeNode from './ProjectTreeNode.vue';

const props = defineProps<{ widget: SiteWidget; normalized: Record<string, unknown> }>();

interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
}

const projectTree: TreeNode = {
  name: 'one-personal-site',
  type: 'folder',
  children: [
    {
      name: 'lxhcool-admin',
      type: 'folder',
      children: [
        { name: 'src', type: 'folder', children: [
          { name: 'components', type: 'folder' },
          { name: 'routes', type: 'folder' },
          { name: 'stores', type: 'folder' },
          { name: 'features', type: 'folder' },
          { name: 'hooks', type: 'folder' },
          { name: 'lib', type: 'folder' },
          { name: 'main.tsx', type: 'file' },
        ] },
        { name: 'public', type: 'folder' },
        { name: 'vite.config.ts', type: 'file' },
        { name: 'package.json', type: 'file' },
      ],
    },
    {
      name: 'lxhcool-backend',
      type: 'folder',
      children: [
        { name: 'src', type: 'folder', children: [
          { name: 'auth', type: 'folder' },
          { name: 'posts', type: 'folder' },
          { name: 'widgets', type: 'folder' },
          { name: 'prisma', type: 'folder' },
          { name: 'projects', type: 'folder' },
          { name: 'friend-links', type: 'folder' },
          { name: 'music', type: 'folder' },
          { name: 'uploads', type: 'folder' },
          { name: 'config', type: 'folder' },
          { name: 'app.module.ts', type: 'file' },
          { name: 'main.ts', type: 'file' },
        ] },
        { name: 'prisma', type: 'folder', children: [
          { name: 'schema.prisma', type: 'file' },
          { name: 'seed.ts', type: 'file' },
        ] },
        { name: 'nest-cli.json', type: 'file' },
        { name: 'package.json', type: 'file' },
      ],
    },
    {
      name: 'lxhcool-frontend',
      type: 'folder',
      children: [
        { name: 'pages', type: 'folder', children: [
          { name: 'blog', type: 'folder' },
          { name: 'friends', type: 'folder' },
          { name: 'projects', type: 'folder' },
          { name: 'index.vue', type: 'file' },
        ] },
        { name: 'components', type: 'folder', children: [
          { name: 'widgets', type: 'folder' },
          { name: 'moments', type: 'folder' },
        ] },
        { name: 'entities', type: 'folder', children: [
          { name: 'post', type: 'folder' },
          { name: 'widget', type: 'folder' },
          { name: 'project', type: 'folder' },
          { name: 'friend-link', type: 'folder' },
          { name: 'admin-user', type: 'folder' },
        ] },
        { name: 'layouts', type: 'folder' },
        { name: 'composables', type: 'folder' },
        { name: 'assets/styles', type: 'folder' },
        { name: 'shared', type: 'folder' },
        { name: 'public/images', type: 'folder' },
        { name: 'app.vue', type: 'file' },
        { name: 'nuxt.config.ts', type: 'file' },
      ],
    },
    { name: 'dev-start.sh', type: 'file' },
    { name: 'README.md', type: 'file' },
  ],
};

const expandedFolders = ref<Set<string>>(new Set(['one-personal-site']));

function toggleFolder(path: string) {
  const copy = new Set(expandedFolders.value);
  if (copy.has(path)) {
    copy.delete(path);
  } else {
    copy.add(path);
  }
  expandedFolders.value = copy;
}

function isExpanded(path: string) {
  return expandedFolders.value.has(path);
}
</script>

<template>
  <div class="project-tree-card">
    <div class="tree-head">
      <span class="widget-heading">{{ widget.title || '项目结构' }}</span>
    </div>
    <div class="tree-body">
      <ul class="tree-root">
        <ProjectTreeNode
          :node="projectTree"
          :path="projectTree.name"
          :depth="0"
          :expanded-folders="expandedFolders"
          @toggle="toggleFolder"
        />
      </ul>
    </div>
  </div>
</template>

<style scoped>
.project-tree-card {
  display: flex;
  flex-direction: column;
  padding: 16px 18px 18px;
}

.tree-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.tree-head .widget-heading {
  margin-bottom: 0;
}

.tree-body {
  font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.8;
}

.tree-root {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>

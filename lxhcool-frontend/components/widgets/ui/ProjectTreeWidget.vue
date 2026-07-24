<script setup lang="ts">
type TreeNode = {
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
};

type FlatTreeNode = {
  name: string;
  type: 'folder' | 'file';
  depth: number;
  collapsed: boolean;
};

const frontendTree: TreeNode = {
  name: 'lxhcool-frontend',
  type: 'folder',
  children: [
    { name: 'public', type: 'folder', children: [
      { name: 'images', type: 'folder' },
      { name: 'fonts', type: 'folder', children: [
        { name: 'lxhcool.woff2', type: 'file' },
        { name: 'lxhcool-bold.woff2', type: 'file' },
        { name: 'lxhcool-mono.woff2', type: 'file' },
      ] },
    ] },
    { name: 'pages', type: 'folder' },
    { name: 'entities', type: 'folder' },
    { name: 'layouts', type: 'folder' },
    { name: 'composables', type: 'folder' },
    { name: 'app.vue', type: 'file' },
    { name: 'nuxt.config.ts', type: 'file' },
    { name: 'tailwind.config.ts', type: 'file' },
    { name: 'package.json', type: 'file' },
  ],
};

function flattenTree(node: TreeNode, depth: number): FlatTreeNode[] {
  const hasChildren = node.type === 'folder' && Boolean(node.children?.length);
  const result: FlatTreeNode[] = [{
    name: node.name,
    type: node.type,
    depth,
    collapsed: node.type === 'folder' && !hasChildren,
  }];

  for (const child of node.children ?? []) {
    result.push(...flattenTree(child, depth + 1));
  }
  return result;
}

const flatTree = flattenTree(frontendTree, 0).slice(1);
</script>

<template>
  <div class="project-tree-widget">
    <div
      v-for="(item, index) in flatTree"
      :key="`${item.depth}-${item.name}-${index}`"
      class="tree-item"
      :class="{ 'tree-folder': item.type === 'folder', 'tree-collapsed': item.collapsed }"
      :style="{ paddingLeft: `${item.depth * 24}px` }"
    >
      <span>{{ item.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.project-tree-widget {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  font-family: Apfel Grotezk, system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  transform: scale(.8);
  transform-origin: top left;
}

.tree-item {
  display: flex;
  min-height: 22.5px;
  align-items: center;
  gap: 10px;
  color: hsl(212, 20%, 23%);
  white-space: nowrap;
}

.tree-item span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-folder::before {
  display: inline-block;
  width: 12px;
  height: 12px;
  flex: 0 0 12px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2329323D' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: cover;
  content: '';
}

.tree-collapsed::before {
  transform: rotate(-90deg);
}
</style>

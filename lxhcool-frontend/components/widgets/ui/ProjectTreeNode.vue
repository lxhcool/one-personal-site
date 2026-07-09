<script setup lang="ts">
interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
}

const props = defineProps<{
  node: TreeNode;
  path: string;
  depth: number;
  expandedFolders: Set<string>;
}>();

const emit = defineEmits<{
  toggle: [path: string];
}>();

const isOpen = computed(() => props.expandedFolders.has(props.path));
const hasChildren = computed(() => props.node.children && props.node.children.length > 0);

function handleClick() {
  if (hasChildren.value) {
    emit('toggle', props.path);
  }
}
</script>

<template>
  <li :class="['tree-item', node.type]">
    <button
      v-if="hasChildren"
      type="button"
      class="tree-toggle"
      :aria-label="isOpen ? 'Collapse' : 'Expand'"
      @click="handleClick"
    >
      <span class="tree-arrow" :class="{ open: isOpen }">▶</span>
      <span class="tree-icon folder-icon">📁</span>
      <span class="tree-name">{{ node.name }}</span>
    </button>
    <span v-else class="tree-leaf">
      <span class="tree-icon file-icon">📄</span>
      <span class="tree-name">{{ node.name }}</span>
    </span>

    <ul v-if="hasChildren && isOpen" class="tree-children">
      <ProjectTreeNode
        v-for="child in node.children"
        :key="child.name"
        :node="child"
        :path="`${path}/${child.name}`"
        :depth="depth + 1"
        :expanded-folders="expandedFolders"
        @toggle="emit('toggle', $event)"
      />
    </ul>
  </li>
</template>

<style scoped>
.tree-item {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tree-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text, #1f2328);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  padding: 1px 4px;
  width: 100%;
  text-align: left;
  transition: background 0.12s ease;
}

.tree-toggle:hover {
  background: var(--hover-bg, #f3f4f6);
}

.tree-arrow {
  font-size: 9px;
  color: #8a94a6;
  transition: transform 0.15s ease;
  flex-shrink: 0;
}

.tree-arrow.open {
  transform: rotate(90deg);
}

.tree-leaf {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 4px 1px 18px;
  font-size: 12px;
  color: var(--text-muted, #6b7280);
}

.tree-icon {
  font-size: 13px;
  flex-shrink: 0;
}

.tree-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-children {
  list-style: none;
  margin: 0;
  padding-left: 14px;
  border-left: 1px solid #e5e7eb;
}
</style>

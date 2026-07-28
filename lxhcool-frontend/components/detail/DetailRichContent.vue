<script setup lang="ts">
defineProps<{
  html: string;
}>();
</script>

<template>
  <div class="detail-rich-content" v-html="html" />
</template>

<style scoped>
.detail-rich-content {
  --rich-ink: color-mix(in oklch, var(--text) 84%, var(--page-bg));
  --rich-strong: var(--text);
  --rich-muted: var(--text-muted);
  --rich-line: color-mix(in oklch, var(--text) 14%, transparent);
  --rich-soft: color-mix(in oklch, var(--text) 7%, transparent);
  --rich-code-bg: color-mix(in oklch, var(--page-bg) 80%, var(--text) 7%);
  --rich-accent: oklch(52% .07 150);
  color: var(--rich-ink);
  font-size: 15px;
  line-height: 1.9;
  text-rendering: optimizeLegibility;
}

:global(:root[data-theme='dark']) .detail-rich-content {
  --rich-ink: color-mix(in oklch, var(--text) 82%, var(--page-bg));
  --rich-line: color-mix(in oklch, white 16%, transparent);
  --rich-soft: color-mix(in oklch, white 8%, transparent);
  --rich-code-bg: color-mix(in oklch, var(--page-bg) 78%, white 7%);
  --rich-accent: oklch(72% .07 150);
}

.detail-rich-content :deep(h2),
.detail-rich-content :deep(h3),
.detail-rich-content :deep(h4) {
  scroll-margin-top: 28px;
  color: var(--rich-strong);
  line-height: 1.35;
}

.detail-rich-content :deep(h2) {
  margin: 42px 0 15px;
  padding-top: 6px;
  font-size: 24px;
  font-weight: 720;
  letter-spacing: -.035em;
}

.detail-rich-content :deep(h2::before) {
  display: inline-block;
  width: 24px;
  color: var(--rich-accent);
  content: '§';
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 700;
}

.detail-rich-content :deep(h3) {
  margin: 30px 0 12px;
  font-size: 18px;
  font-weight: 680;
}

.detail-rich-content :deep(h4) {
  margin: 24px 0 10px;
  font-size: 15px;
  font-weight: 680;
}

.detail-rich-content :deep(p) {
  margin: 0 0 16px;
}

.detail-rich-content :deep(strong) {
  color: var(--rich-strong);
  font-weight: 680;
}

.detail-rich-content :deep(a) {
  color: var(--rich-strong);
  text-decoration: underline;
  text-decoration-color: var(--rich-accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

.detail-rich-content :deep(a:hover) {
  color: var(--rich-accent);
}

.detail-rich-content :deep(ul),
.detail-rich-content :deep(ol) {
  margin: 8px 0 18px;
  padding-left: 1.45em;
}

.detail-rich-content :deep(li) {
  margin: 5px 0;
  padding-left: .18em;
}

.detail-rich-content :deep(li::marker) {
  color: var(--rich-accent);
}

.detail-rich-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 28px 0;
  border-radius: 12px;
  cursor: zoom-in;
}

.detail-rich-content :deep(blockquote) {
  margin: 24px 0;
  padding: 2px 0 2px 18px;
  border-left: 2px solid var(--rich-accent);
  color: var(--rich-muted);
}

.detail-rich-content :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

.detail-rich-content :deep(code) {
  padding: .12em .36em;
  border-radius: 5px;
  background: var(--rich-code-bg);
  color: var(--rich-strong);
  font-family: 'IBM Plex Mono', monospace;
  font-size: .88em;
}

.detail-rich-content :deep(pre) {
  overflow-x: auto;
  margin: 24px 0;
  padding: 16px 17px;
  border: 1px solid var(--rich-line);
  border-radius: 12px;
  background: oklch(18% .014 245);
  color: #e7ecec;
  font-size: 13px;
  line-height: 1.72;
}

.detail-rich-content :deep(pre code) {
  display: block;
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: inherit;
}

.detail-rich-content :deep(table) {
  width: 100%;
  margin: 24px 0;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 1.6;
}

.detail-rich-content :deep(th),
.detail-rich-content :deep(td) {
  padding: 9px 10px;
  border: 1px solid var(--rich-line);
  text-align: left;
  vertical-align: top;
}

.detail-rich-content :deep(th) {
  background: var(--rich-soft);
  color: var(--rich-strong);
  font-weight: 680;
}

.detail-rich-content :deep(hr) {
  height: 1px;
  margin: 32px 0;
  border: 0;
  background: linear-gradient(90deg, transparent, var(--rich-line), transparent);
}

.detail-rich-content :deep(.task-list-item) {
  list-style: none;
}

.detail-rich-content :deep(.task-list-item input) {
  margin: 0 8px 0 -1.25em;
  accent-color: var(--rich-accent);
  vertical-align: -1px;
}

.detail-rich-content :deep(.hljs-comment),
.detail-rich-content :deep(.hljs-quote) {
  color: #8b949e;
  font-style: italic;
}

.detail-rich-content :deep(.hljs-keyword),
.detail-rich-content :deep(.hljs-selector-tag),
.detail-rich-content :deep(.hljs-literal) {
  color: #ff7b72;
}

.detail-rich-content :deep(.hljs-string),
.detail-rich-content :deep(.hljs-regexp),
.detail-rich-content :deep(.hljs-addition) {
  color: #a5d6ff;
}

.detail-rich-content :deep(.hljs-title),
.detail-rich-content :deep(.hljs-section),
.detail-rich-content :deep(.hljs-function .hljs-title) {
  color: #d2a8ff;
}

.detail-rich-content :deep(.hljs-number),
.detail-rich-content :deep(.hljs-symbol),
.detail-rich-content :deep(.hljs-bullet) {
  color: #79c0ff;
}

.detail-rich-content :deep(.hljs-variable),
.detail-rich-content :deep(.hljs-template-variable),
.detail-rich-content :deep(.hljs-type),
.detail-rich-content :deep(.hljs-built_in) {
  color: #ffa657;
}

.detail-rich-content :deep(.hljs-attr),
.detail-rich-content :deep(.hljs-attribute),
.detail-rich-content :deep(.hljs-selector-class),
.detail-rich-content :deep(.hljs-selector-id) {
  color: #7ee787;
}

.detail-rich-content :deep(.hljs-meta),
.detail-rich-content :deep(.hljs-doctag) {
  color: #f2cc60;
}

.detail-rich-content :deep(.hljs-deletion) {
  background: rgba(248, 81, 73, .12);
  color: #ffa198;
}
</style>

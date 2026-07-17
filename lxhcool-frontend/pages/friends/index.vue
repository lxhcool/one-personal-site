<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue';
import { listPublicFriendLinks } from '~/entities/friend-link/api/friendLinkApi';

const { data: friendLinksData } = await useAsyncData('public-friend-links', () => listPublicFriendLinks());
const friendLinks = computed(() => {
  if (!friendLinksData.value) throw createError({ statusCode: 500, statusMessage: 'Failed to load friend links' });
  return friendLinksData.value;
});

function initials(name: string) { return name.trim().slice(0, 2).toUpperCase(); }
</script>

<template>
  <main>
    <WorkbenchWindow path="~/friends" :status="`${friendLinks.length} contacts`" title="桌面通讯录">
      <template #eyebrow>people on the web</template>
      <template #headingAside>去看看他们正在创造什么</template>

      <div v-if="friendLinks.length" class="friend-grid">
        <a v-for="friend in friendLinks" :key="friend.id" :href="friend.url" target="_blank" rel="noreferrer" class="friend-card">
          <span class="friend-avatar">
            <img v-if="friend.logo" :src="friend.logo" :alt="friend.name" />
            <span v-else>{{ initials(friend.name) }}</span>
          </span>
          <span class="friend-copy">
            <strong>{{ friend.name }}</strong>
            <span>{{ friend.description || '访问这个朋友的网站' }}</span>
            <small>{{ friend.category || 'friend.link' }}</small>
          </span>
          <ArrowUpRight :size="14" />
        </a>
      </div>
      <div v-else class="friend-empty">通讯录里暂时还没有联系人。</div>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.friend-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 11px; }
.friend-card { position: relative; display: grid; grid-template-columns: 44px minmax(0,1fr) 15px; gap: 12px; align-items: center; min-height: 104px; padding: 15px; overflow: hidden; border: 1px solid rgba(105,91,72,.12); border-radius: 7px; background: rgba(238,233,223,.64); transition: transform 150ms ease, background 150ms ease; }
.friend-card:nth-child(3n+2) { transform: rotate(.35deg); }.friend-card:nth-child(3n) { transform: rotate(-.25deg); }.friend-card:hover { z-index: 1; transform: translateY(-2px) rotate(0); background: rgba(243,238,228,.86); }
.friend-avatar { display: grid; width: 44px; height: 44px; place-items: center; overflow: hidden; border-radius: 8px; background: linear-gradient(145deg,#e2e5e4,#cdd3d3); color: #5e6971; font-family: 'IBM Plex Mono',monospace; font-size: 10px; font-weight: 700; box-shadow: inset 0 1px rgba(255,255,255,.6), 2px 3px 6px rgba(50,60,66,.1); }.friend-avatar img { width: 100%; height: 100%; object-fit: cover; }
.friend-copy { display: grid; gap: 4px; min-width: 0; }.friend-copy strong { color: #344049; font-size: 13px; }.friend-copy > span { display: -webkit-box; overflow: hidden; color: #778189; font-size: 9px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.friend-copy small { color: #4f806c; font-family: 'IBM Plex Mono',monospace; font-size: 7px; text-transform: uppercase; }.friend-card > svg { color: #a0a6aa; }
.friend-empty { padding: 70px 20px; color: #7f888f; font-size: 12px; text-align: center; }
@media (max-width: 590px) { .friend-grid { grid-template-columns: 1fr; } }
</style>

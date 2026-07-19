<script setup lang="ts">
import { listPublicFriendLinks } from '~/entities/friend-link/api/friendLinkApi';
import type { FriendLink } from '~/entities/friend-link/model/types';

const { data: friendLinksData } = await useAsyncData('public-friend-links', () => listPublicFriendLinks());
const friendLinks = computed(() => {
  if (!friendLinksData.value) throw createError({ statusCode: 500, statusMessage: 'Failed to load friend links' });
  return friendLinksData.value;
});

const linkGroups = computed(() => {
  const groups = new Map<string, FriendLink[]>();
  for (const friend of friendLinks.value) {
    const category = friend.category?.trim() || '朋友们';
    const group = groups.get(category) ?? [];
    group.push(friend);
    groups.set(category, group);
  }
  return Array.from(groups, ([category, links]) => ({ category, links }));
});

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

function readHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'external.link';
  }
}
</script>

<template>
  <main>
    <WorkbenchWindow path="~/friends" :status="`${friendLinks.length} contacts`">
      <div v-if="friendLinks.length" class="link-directory">
        <section v-for="group in linkGroups" :key="group.category" class="link-group">
          <header class="group-heading">
            <strong>{{ group.category }}</strong>
            <span>{{ group.links.length }} 个链接</span>
          </header>

          <a
            v-for="friend in group.links"
            :key="friend.id"
            :href="friend.url"
            target="_blank"
            rel="noreferrer"
            class="friend-row"
          >
            <span class="friend-avatar">
              <img v-if="friend.logo" :src="friend.logo" :alt="friend.name" />
              <span v-else>{{ initials(friend.name) }}</span>
            </span>
            <span class="friend-copy">
              <strong>{{ friend.name }}</strong>
              <small>{{ friend.description || '访问这个朋友的网站' }}</small>
            </span>
            <span class="friend-domain">{{ readHostname(friend.url) }} <span aria-hidden="true">↗</span></span>
          </a>
        </section>
      </div>

      <div v-else class="friend-empty">
        <span>0 contacts</span>
        <p>通讯录里暂时还没有联系人。</p>
      </div>
    </WorkbenchWindow>
  </main>
</template>

<style scoped>
.link-directory { display: grid; gap: 27px; }
.group-heading { display: flex; align-items: baseline; justify-content: space-between; min-height: 27px; border-bottom: 1px solid rgba(89,78,62,.18); font-family: 'IBM Plex Mono', monospace; }
.group-heading strong { color: #47535a; font-size: 11px; }
.group-heading span { color: #92999d; font-size: 8px; }
.friend-row { display: grid; grid-template-columns: 34px minmax(0,1fr) 116px; gap: 11px; align-items: center; min-height: 58px; padding: 7px 8px; border-bottom: 1px dashed rgba(89,78,62,.13); transition: background 130ms ease; }
.friend-row:hover { border-radius: 4px; background: rgba(235,228,215,.22); }
.friend-avatar { display: grid; width: 32px; height: 32px; place-items: center; overflow: hidden; border-radius: 5px; background: rgba(178,185,184,.38); color: #667177; font-family: 'IBM Plex Mono', monospace; font-size: 8px; font-weight: 700; }
.friend-avatar img { width: 100%; height: 100%; object-fit: cover; }
.friend-copy { display: grid; gap: 4px; min-width: 0; }
.friend-copy strong { overflow: hidden; color: #3f4b52; font-size: 13px; letter-spacing: -.015em; text-overflow: ellipsis; white-space: nowrap; }
.friend-copy small { overflow: hidden; color: #818a90; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.friend-domain { overflow: hidden; color: #768086; font-family: 'IBM Plex Mono', monospace; font-size: 8px; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.friend-domain span { color: #4f806c; }
.friend-empty { padding: 70px 20px; color: #7f888f; text-align: center; }
.friend-empty span { font-family: 'IBM Plex Mono', monospace; font-size: 10px; }
.friend-empty p { font-size: 12px; }
@media (max-width: 560px) {
  .link-directory { gap: 22px; }
  .friend-row { grid-template-columns: 30px minmax(0,1fr); min-height: 54px; padding-inline: 4px; }
  .friend-avatar { width: 28px; height: 28px; }
  .friend-domain { display: none; }
}
</style>

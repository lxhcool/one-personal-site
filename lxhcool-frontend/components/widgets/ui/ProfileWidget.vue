<script setup lang="ts">
import type { SiteWidget } from '~/entities/widget/model/types';
import { getSocialIconUrl, getSocialLabel } from '../strategies/useProfile';

defineProps<{ widget: SiteWidget; normalized: Record<string, unknown> }>();
</script>

<template>
  <div class="profile-card">
    <div class="profile-card-bg" />
    <div class="profile-main">
      <div class="profile-avatar-wrap">
        <img
          class="profile-avatar"
          :src="(normalized.avatar as string) || '/images/default-avatar.jpg'"
          :alt="(normalized.name as string) || ''"
        />
      </div>
      <div class="profile-info">
        <div class="profile-name">{{ normalized.name || '星辰' }}</div>
        <p class="profile-bio">{{ normalized.bio || '热爱技术与设计，专注于创造有价值的产品体验 ✨' }}</p>
      </div>
    </div>
    <div
      v-if="Array.isArray(normalized.socials) && normalized.socials.length"
      class="profile-socials"
    >
      <a
        v-for="social in normalized.socials"
        :key="social.platform || social.url || social.qrCode"
        :href="social.url || undefined"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link"
        :title="getSocialLabel(social)"
      >
        <img v-if="getSocialIconUrl(social)" :src="getSocialIconUrl(social)" :alt="getSocialLabel(social)" />
        <span v-else class="social-text">{{ getSocialLabel(social).slice(0, 2) }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 18px 18px;
  overflow: hidden;
}

.profile-card-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #eef2ff 0%, #faf5ff 50%, #fff1f2 100%);
}

.profile-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  text-align: center;
}

.profile-avatar-wrap {
  position: relative;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
  background: #e8e8ed;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.profile-bio {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.profile-socials {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.social-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
}

.social-link img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.social-text {
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 700;
}
</style>

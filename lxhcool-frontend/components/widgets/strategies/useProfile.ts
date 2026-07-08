import type { WidgetStrategy } from './types';
import { resolveAssetUrl, readArray, readString } from './shared';

type ProfileSocial = {
  platform: string;
  label: string;
  url: string;
  icon?: string;
  color?: string;
  qrCode?: string;
};

const socialDefaultColors: Record<string, string> = {
  github: '181717', gitee: 'C71D23', douyin: '000000', tiktok: '000000',
  xiaohongshu: 'FF2442', bilibili: '00A1D6', 'netease-cloud-music': 'D43C33',
  neteasecloudmusic: 'D43C33', zhihu: '0084FF', juejin: '1E80FF',
  csdn: 'FC5531', weibo: 'E6162D', sinaweibo: 'E6162D', telegram: '26A5E4',
  discord: '5865F2', instagram: 'E4405F', youtube: 'FF0000', x: '000000',
  wechat: '07C160', qq: '1EBAFC', tencentqq: '1EBAFC',
};

export function useProfile(): WidgetStrategy {
  return {
    normalize(config) {
      return {
        coverImage: resolveAssetUrl(readString(config, 'coverImage')),
        avatar: resolveAssetUrl(readString(config, 'avatar')),
        name: readString(config, 'name'),
        role: readString(config, 'role'),
        bio: readString(config, 'bio'),
        socials: readArray<ProfileSocial>(config, 'socials'),
        stats: readArray<{ label: string; value: string }>(config, 'stats'),
      };
    },
  };
}

export function getSocialIconUrl(social: ProfileSocial) {
  const icon = social.icon?.trim();
  if (!icon || icon.startsWith('http')) return icon || '';
  const simpleIcon = icon === 'douyin' ? 'tiktok' : icon;
  const color =
    normalizeIconColor(social.color) ||
    getSocialDefaultColor(social.platform) ||
    getSocialDefaultColor(simpleIcon) ||
    '111827';
  return `https://cdn.simpleicons.org/${encodeURIComponent(simpleIcon)}/${color}`;
}

export function getSocialLabel(social: ProfileSocial) {
  return social.label || social.platform || '社交链接';
}

function normalizeIconColor(value?: string) {
  const text = value?.trim().replace(/^#/, '') ?? '';
  return /^[0-9a-fA-F]{6}$/.test(text) ? text : '';
}

function getSocialDefaultColor(value?: string) {
  return value ? socialDefaultColors[value.trim().toLowerCase()] || '' : '';
}

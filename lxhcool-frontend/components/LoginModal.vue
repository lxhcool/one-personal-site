<script setup lang="ts">
import { Mail, Lock, Loader2, Eye, EyeOff } from '@lucide/vue';
import { loginAdminUser } from '~/entities/admin-user/api/authApi';

const props = defineProps<{ adminUrl: string }>();
const emit = defineEmits<{ close: [] }>();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);

async function handleSubmit() {
  error.value = '';
  if (!email.value.trim()) {
    error.value = '请输入邮箱';
    return;
  }
  if (!password.value) {
    error.value = '请输入密码';
    return;
  }
  loading.value = true;
  try {
    await loginAdminUser({ email: email.value.trim(), password: password.value });
    window.location.replace(props.adminUrl);
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'data' in e
      ? (e as { data?: { message?: string } }).data?.message
      : undefined;
    error.value = msg || '登录失败，请检查邮箱和密码';
  } finally {
    loading.value = false;
  }
}

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('login-modal-overlay')) {
    emit('close');
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="login-modal-overlay" @click="onOverlayClick">
      <div class="login-modal" @click.stop>
        <div class="login-modal-brand">
          <span class="login-brand-icon">⚡</span>
          <h2>管理员登录</h2>
          <p>登录后跳转至后台管理</p>
        </div>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="login-field">
            <span class="login-field-icon"><Mail :size="18" /></span>
            <input
              v-model="email"
              type="email"
              placeholder="name@example.com"
              autocomplete="email"
              :disabled="loading"
            />
          </div>

          <div class="login-field">
            <span class="login-field-icon"><Lock :size="18" /></span>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入密码"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              class="login-toggle-pw"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>

          <p v-if="error" class="login-error">{{ error }}</p>

          <button type="submit" class="login-submit" :disabled="loading">
            <Loader2 v-if="loading" :size="18" class="animate-spin" />
            <span v-else>登录后台</span>
          </button>
        </form>

        <button class="login-modal-close" @click="emit('close')" aria-label="关闭">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.login-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  animation: fadeIn 0.2s ease;
}

.login-modal {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  padding: 40px 32px 32px;
  animation: slideUp 0.25s ease;
}

.login-modal-brand {
  text-align: center;
  margin-bottom: 28px;
}

.login-brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  font-size: 22px;
  margin-bottom: 12px;
}

.login-modal-brand h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.login-modal-brand p {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

.login-form {
  display: grid;
  gap: 14px;
}

.login-field {
  position: relative;
  display: flex;
  align-items: center;
}

.login-field-icon {
  position: absolute;
  left: 14px;
  display: flex;
  color: #9ca3af;
  pointer-events: none;
}

.login-field input {
  width: 100%;
  height: 46px;
  padding: 0 42px 0 42px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #1f2937;
  background: #f9fafb;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.login-field input:focus {
  border-color: #667eea;
  background: #fff;
}

.login-field input::placeholder {
  color: #d1d5db;
}

.login-field input:disabled {
  opacity: 0.6;
}

.login-toggle-pw {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
}

.login-toggle-pw:hover {
  color: #6b7280;
  background: #f3f4f6;
}

.login-error {
  margin: -4px 0 0;
  font-size: 13px;
  color: #ef4444;
  text-align: center;
}

.login-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  margin-top: 4px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.login-submit:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}

.login-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-submit .animate-spin {
  animation: spin 0.8s linear infinite;
}

.login-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.login-modal-close:hover {
  background: #f3f4f6;
  color: #4b5563;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

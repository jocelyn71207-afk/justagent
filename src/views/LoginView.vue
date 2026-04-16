<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-logo">
        <img src="@/assets/logo-new.png" alt="JUSTAGENT" />
      </div>
      <div class="login-header">
        <!-- Removed prominent title as per feedback -->
      </div>

      <div class="social-login">
        <button class="social-btn google-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.11c-.22-.67-.35-1.39-.35-2.11s.13-1.44.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button class="social-btn facebook-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.03 4.41 11.02 10.12 12V15.56H7.13V12.07h2.99V9.41c0-2.96 1.76-4.59 4.44-4.59 1.28 0 2.63.23 2.63.23v2.9h-1.48c-1.46 0-1.92.91-1.92 1.84v2.21h3.26l-.52 3.49h-2.74V24.07C19.59 23.09 24 18.1 24 12.07z" fill="#1877F2"/>
          </svg>
          Facebook
        </button>
      </div>

      <div class="divider">
        <span>或使用 email 繼續</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <i class="material-symbols-rounded">mail</i>
          <input type="text" placeholder="Email" v-model="email" />
        </div>
        <div class="input-group">
          <i class="material-symbols-rounded">lock</i>
          <input :type="showPassword ? 'text' : 'password'" placeholder="Password" v-model="password" />
          <i class="material-symbols-rounded visibility-toggle" @click="showPassword = !showPassword">
            {{ showPassword ? 'visibility' : 'visibility_off' }}
          </i>
        </div>

        <div class="form-actions">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" />
            <span>記住帳號</span>
          </label>
          <a href="#" class="forgot-password">忘記密碼？</a>
        </div>

        <button type="submit" class="login-submit-btn">登入</button>
      </form>

      <div class="login-footer">
        <p>還沒有帳號？ <a href="#" class="create-account">創建帳號</a></p>
      </div>
    </div>

    <footer class="company-info">
      <p>© 2026莫比機器人股份有限公司</p>
      <div class="footer-links">
        <a href="#">隱私政策</a>
        <span class="sep">|</span>
        <a href="#">服務條款</a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);

const handleLogin = () => {
  console.log('Login attempt:', { email: email.value, password: password.value, rememberMe: rememberMe.value });
  // For demo purposes, we just navigate to the dashboard
  router.push('/view/ProjectDashboard');
};
</script>

<style scoped lang="scss">
.login-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-wise-bg);
  font-family: 'Microsoft JhengHei', sans-serif;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: var(--color-wise-card);
  border: 1px solid rgba(14, 15, 12, 0.12);
  border-radius: 28px;
  padding: 40px;
  box-shadow: rgba(14, 15, 12, 0.06) 0px 8px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-logo {
  display: flex;
  justify-content: center;

  img {
    height: 36px;
    filter: brightness(0.2);
  }
}

.login-header {
  text-align: center;
  h1 {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--color-wise-black);
  }
  p {
    font-size: 14px;
    color: var(--color-wise-gray);
  }
}

.social-login {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 48px;
  background: var(--color-wise-card);
  border: 1px solid rgba(14, 15, 12, 0.12);
  border-radius: 9999px;
  color: var(--color-wise-black);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-wise-surface);
    transform: translateY(-1px);
    box-shadow: rgba(14, 15, 12, 0.06) 0px 4px 12px;
  }

  svg {
    flex-shrink: 0;
  }
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--color-wise-gray);
  font-size: 12px;

  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid rgba(14, 15, 12, 0.10);
  }

  span {
    padding: 0 12px;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;

  .material-symbols-rounded {
    position: absolute;
    left: 16px;
    color: var(--color-wise-gray);
    font-size: 20px;
    font-family: 'Material Symbols Rounded';
  }

  input {
    width: 100%;
    height: 48px;
    background: var(--color-wise-bg);
    border: 1px solid rgba(14, 15, 12, 0.12);
    border-radius: 9999px;
    padding: 0 48px;
    color: var(--color-wise-black);
    font-size: 15px;
    transition: all 0.2s ease;

    &::placeholder {
      color: var(--color-wise-gray);
    }

    &:focus {
      outline: none;
      background: var(--color-wise-card);
      border-color: var(--color-wise-green);
      box-shadow: 0 0 0 3px rgba(159, 232, 112, 0.2);
    }
  }

  .visibility-toggle {
    left: auto;
    right: 16px;
    cursor: pointer;
    &:hover {
      color: var(--color-wise-dark-green);
    }
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--color-wise-gray);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--color-wise-black);
  }

  input {
    width: 16px;
    height: 16px;
    accent-color: var(--color-wise-green);
  }
}

.forgot-password {
  color: var(--color-wise-dark-green);
  font-weight: 500;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.login-submit-btn {
  height: 52px;
  background: var(--color-wise-green);
  border: none;
  border-radius: 9999px;
  color: var(--color-wise-dark-green);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
  margin-top: 8px;

  &:hover {
    transform: scale(1.02);
    box-shadow: rgba(22, 51, 0, 0.18) 0px 8px 20px;
  }

  &:active {
    transform: scale(0.99);
  }
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: var(--color-wise-gray);

  .create-account {
    color: var(--color-wise-dark-green);
    font-weight: 600;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.company-info {
  margin-top: 40px;
  text-align: center;
  color: var(--color-wise-gray);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .footer-links {
    display: flex;
    justify-content: center;
    gap: 12px;
    align-items: center;

    a {
      color: var(--color-wise-gray);
      text-decoration: none;
      &:hover {
        color: var(--color-wise-black);
      }
    }

    .sep {
      opacity: 0.3;
    }
  }
}

@media (max-width: 480px) {
  .login-card {
    max-width: 90%;
    padding: 30px 20px;
  }

  .social-login {
    grid-template-columns: 1fr;
  }
}
</style>

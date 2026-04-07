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
@use "@/scss/base/_variables.scss" as *;

.login-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft JhengHei', sans-serif;
  
  // Vibrant Linear Gradient Background with Smooth Animation
  background: linear-gradient(135deg, #4ade80, #22c55e, #06b6d4, #22c55e);
  background-size: 400% 400%;
  animation: gradient-flow 15s ease infinite;
  background-attachment: fixed;
}

@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes rotate-bg {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 12px 48px rgba(0, 60, 20, 0.18), 0 2px 0 rgba(255, 255, 255, 0.9) inset;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #333;
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 2px;
  
  img {
    height: 36px;
    // Removed brightening filters to ensure contrast on white background
    filter: brightness(0.2); // Making it a sharp dark grey/black for contrast
  }
}

.login-header {
  text-align: center;
  h1 {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #1a1a1a;
  }
  p {
    font-size: 14px;
    opacity: 0.8;
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
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  svg {
    flex-shrink: 0;
  }
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #adb5bd;
  font-size: 12px;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e9ecef;
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
    color: #adb5bd;
    font-size: 20px;
    font-family: 'Material Symbols Rounded';
  }
  
  input {
    width: 100%;
    height: 48px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 0 48px;
    color: #495057;
    font-size: 15px;
    transition: all 0.2s ease;
    
    &::placeholder {
      color: #adb5bd;
    }
    
    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.8);
      border-color: $color_main_1;
      box-shadow: 0 0 0 4px rgba($color_main_1, 0.1);
    }
  }
  
  .visibility-toggle {
    left: auto;
    right: 16px;
    cursor: pointer;
    &:hover {
      color: $color_main_1;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #6c757d;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: #1a1a1a;
  }
  
  input {
    width: 16px;
    height: 16px;
    accent-color: $color_main_1;
  }
}

.forgot-password {
  color: $color_main_1;
  font-weight: 500;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

.login-submit-btn {
  height: 52px;
  background: $color_main_1;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  
  &:hover {
    background: $color_main_3;
    box-shadow: 0 4px 15px rgba($color_main_1, 0.4);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #6c757d;
  .create-account {
    color: $color_main_1;
    font-weight: 600;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.company-info {
  margin-top: 40px;
  z-index: 1;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
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
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      &:hover {
        color: #fff;
      }
    }
    
    .sep {
      opacity: 0.3;
    }
  }
}

// Media Queries
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

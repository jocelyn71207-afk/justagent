import './scss/style.scss'

import App from './App.vue'
import router from './router'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import FloatingVue from 'floating-vue'
import VueSweetalert2 from 'vue-sweetalert2'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// tooltip 套件
app.use(FloatingVue, {
  distance: 10,      // 距離
  instantMove: true, // 切換是否立即移動
})

// dialog 套件
app.use(VueSweetalert2)

app.mount('#app')

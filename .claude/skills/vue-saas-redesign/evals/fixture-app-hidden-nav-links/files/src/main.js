import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import Home from './views/Home.vue'
import Contacts from './views/Contacts.vue'
import Deals from './views/Deals.vue'
import Settings from './views/Settings.vue'
import Billing from './views/Billing.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home, meta: { title: 'Home' } },
    { path: '/contacts', component: Contacts, meta: { title: 'Contacts' } },
    { path: '/deals', component: Deals, meta: { title: 'Deals' } },
    { path: '/settings', component: Settings, meta: { title: 'Settings' } },
    { path: '/billing', component: Billing, meta: { title: 'Billing' } }
  ]
})

createApp(App).use(router).mount('#app')

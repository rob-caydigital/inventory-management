<template>
  <header class="topnav">
    <div class="brand">Pulse<span>CRM</span></div>
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/contacts">Contacts</router-link>
      <router-link to="/deals">Deals</router-link>
      <div class="more" @mouseleave="moreOpen = false">
        <button @click="moreOpen = !moreOpen">More &#9662;</button>
        <div v-if="moreOpen" class="more-menu">
          <router-link to="/settings" @click="moreOpen = false">Settings</router-link>
          <router-link to="/billing" @click="moreOpen = false">Billing</router-link>
        </div>
      </div>
    </nav>
    <input class="search" v-model="query" placeholder="Search contacts..." />
    <UserMenu />
  </header>
</template>

<script setup>
import { ref } from 'vue'
import UserMenu from './UserMenu.vue'

const moreOpen = ref(false)
const query = ref('')
</script>

<style scoped>
.topnav { position: fixed; top: 0; left: 0; right: 0; height: 55px; background: #4c1d95; color: white; display: flex; align-items: center; gap: 22px; padding: 0 18px; z-index: 10; }
.brand { font-weight: bold; font-size: 19px; }
.brand span { color: #c4b5fd; margin-left: 2px; }
nav { display: flex; gap: 14px; align-items: center; }
nav a { color: #ddd6fe; text-decoration: none; }
nav a.router-link-exact-active { color: white; text-decoration: underline; }
.more { position: relative; }
.more button { background: none; border: none; color: #ddd6fe; cursor: pointer; font-size: 15px; }
.more-menu { position: absolute; top: 30px; left: 0; background: white; border: 1px solid #ccc; display: flex; flex-direction: column; min-width: 120px; }
.more-menu a { color: #333; padding: 8px 10px; }
.search { margin-left: auto; padding: 6px 9px; border-radius: 4px; border: none; width: 210px; }
</style>

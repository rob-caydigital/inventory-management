<template>
  <div class="user" @mouseleave="open = false">
    <button class="avatar" @click="open = !open">AL</button>
    <div v-if="open" class="menu">
      <div class="who">Ada Lovelace<br /><small>ada@pulse.example</small></div>
      <a href="#" @click.prevent="open = false">Profile</a>
      <a href="#" @click.prevent="open = false">Sign out</a>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>

<style scoped>
.user { position: relative; }
.avatar { width: 34px; height: 34px; border-radius: 50%; border: none; background: #a78bfa; color: white; font-weight: bold; cursor: pointer; }
.menu { position: absolute; right: 0; top: 42px; background: white; color: #222; border: 1px solid #ccc; width: 190px; display: flex; flex-direction: column; }
.who { padding: 10px; border-bottom: 1px solid #eee; }
.menu a { padding: 8px 10px; color: #333; text-decoration: none; }
</style>

<template>
  <div>
    <h1>Welcome back, Ada</h1>
    <div class="kpis">
      <div class="box kpi" v-for="k in kpis" :key="k.label">
        <div class="label">{{ k.label }}</div>
        <div class="value">{{ k.value }}</div>
      </div>
    </div>
    <div class="box">
      <h3>Recent activity</h3>
      <ul>
        <li v-for="a in activity" :key="a.id">{{ a.text }} <small>{{ a.when }}</small></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const kpis = [
  { label: 'Open deals', value: 42 },
  { label: 'Pipeline value', value: '$318,400' },
  { label: 'Won this month', value: 9 },
  { label: 'New contacts', value: 27 }
]
const activity = [
  { id: 1, text: 'Grace Hopper moved "Fleet renewal" to Negotiation', when: '2h ago' },
  { id: 2, text: 'New contact added: Alan Turing', when: '5h ago' },
  { id: 3, text: 'Deal "Analytical Engine v2" marked won', when: 'yesterday' }
]
</script>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11px; margin-bottom: 18px; }
.kpi .label { color: #777; font-size: 13px; }
.kpi .value { font-size: 26px; font-weight: bold; margin-top: 3px; }
</style>

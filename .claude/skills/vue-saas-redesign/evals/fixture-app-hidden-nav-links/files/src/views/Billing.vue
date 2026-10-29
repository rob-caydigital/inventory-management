<template>
  <div>
    <h2>Billing</h2>
    <div class="box">
      <h3>Current plan: Growth</h3>
      <p>$49 per seat / month · 8 seats · renews Dec 1</p>
      <button class="btn">Change plan</button>
    </div>
    <div class="box">
      <h3>Invoices</h3>
      <table>
        <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          <tr v-for="i in invoices" :key="i.date"><td>{{ i.date }}</td><td>{{ i.amount }}</td><td>{{ i.status }}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const invoices = [
  { date: '2026-10-01', amount: '$392.00', status: 'Paid' },
  { date: '2026-09-01', amount: '$392.00', status: 'Paid' },
  { date: '2026-08-01', amount: '$343.00', status: 'Paid' }
]
</script>

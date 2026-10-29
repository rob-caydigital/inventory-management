<template>
  <div>
    <h2>Deals</h2>
    <div class="box">
      <table>
        <thead><tr><th>Deal</th><th>Owner</th><th>Stage</th><th>Value</th></tr></thead>
        <tbody>
          <tr v-for="d in deals" :key="d.id">
            <td>{{ d.name }}</td><td>{{ d.owner }}</td>
            <td><span :class="['pill', d.status]">{{ d.stage }}</span></td>
            <td>${{ d.value.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const deals = [
  { id: 'd1', name: 'Fleet renewal', owner: 'Grace Hopper', stage: 'Negotiation', status: 'open', value: 84000 },
  { id: 'd2', name: 'Analytical Engine v2', owner: 'Ada Lovelace', stage: 'Won', status: 'won', value: 120000 },
  { id: 'd3', name: 'Cipher audit', owner: 'Alan Turing', stage: 'Lost', status: 'lost', value: 18500 },
  { id: 'd4', name: 'Trajectory suite', owner: 'Katherine Johnson', stage: 'Proposal', status: 'open', value: 95900 }
]
</script>

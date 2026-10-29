<template>
  <div>
    <h2 style="margin-bottom:9px">Contacts</h2>
    <div class="box">
      <button class="btn" @click="showAdd = true">Add contact</button>
      <table style="margin-top:12px">
        <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Deals</th></tr></thead>
        <tbody>
          <tr v-for="c in contacts" :key="c.email">
            <td>{{ c.name }}</td><td>{{ c.company }}</td><td>{{ c.email }}</td><td>{{ c.deals }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showAdd" class="modal-bg" @click.self="showAdd = false">
      <div class="modal">
        <h3>Add contact</h3>
        <input v-model="draft" placeholder="Full name" />
        <div style="margin-top:10px">
          <button class="btn" @click="add">Save</button>
          <button @click="showAdd = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showAdd = ref(false)
const draft = ref('')
const contacts = ref([
  { name: 'Grace Hopper', company: 'Navy Systems', email: 'grace@navy.example', deals: 3 },
  { name: 'Alan Turing', company: 'Bletchley Ltd', email: 'alan@bletchley.example', deals: 1 },
  { name: 'Katherine Johnson', company: 'Orbital Co', email: 'kj@orbital.example', deals: 4 },
  { name: 'Linus Torvalds', company: 'Kernel Labs', email: 'linus@kernel.example', deals: 2 }
])

const add = () => {
  if (!draft.value.trim()) return
  const slug = draft.value.trim().toLowerCase().replace(/\s+/g, '.')
  contacts.value.push({ name: draft.value.trim(), company: '-', email: `${slug}@new.example`, deals: 0 })
  draft.value = ''
  showAdd.value = false
}
</script>

<style scoped>
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: grid; place-items: center; z-index: 5; }
.modal { background: white; padding: 17px; border-radius: 4px; width: 320px; }
.modal input { width: 100%; padding: 6px; box-sizing: border-box; }
</style>

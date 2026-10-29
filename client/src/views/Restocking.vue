<template>
  <div class="page restocking">
    <div class="page-header">
      <h2>{{ t('restocking.title') }}</h2>
      <p>{{ t('restocking.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="page-body">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">{{ t('restocking.budget') }}</div>
          <div class="stat-value">{{ formatMoney(budget) }}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">{{ t('restocking.allocated') }}</div>
          <div class="stat-value">{{ formatMoney(allocated) }}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">{{ t('restocking.remaining') }}</div>
          <div class="stat-value">{{ formatMoney(remaining) }}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">{{ t('restocking.longestLeadTime') }}</div>
          <div class="stat-value">{{ t('restocking.days', { count: longestLeadTime }) }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('restocking.budget') }}</h3>
        </div>
        <div class="card-body budget-controls">
          <input
            type="range"
            class="budget-slider"
            min="0"
            :max="maxBudget"
            :step="budgetStep"
            v-model.number="budget"
            :aria-label="t('restocking.budget')"
          />
          <div class="budget-input-wrap">
            <span class="budget-symbol">{{ currencySymbol }}</span>
            <input
              type="text"
              inputmode="numeric"
              class="budget-input"
              :value="budget.toLocaleString()"
              :aria-label="t('restocking.budget')"
              @change="onBudgetInput"
            />
          </div>
        </div>
      </div>

      <div v-if="orderResult" class="notice notice-success">
        <span>{{ t('restocking.success', { orderNumber: orderResult.order_number, date: orderResult.expected_delivery }) }}</span>
        <router-link to="/orders">{{ t('restocking.viewOrders') }}</router-link>
      </div>
      <div v-if="submitError" class="notice notice-error">{{ submitError }}</div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('restocking.recommendation') }}</h3>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canSubmit"
            @click="placeOrder"
          >
            {{ submitting ? t('restocking.placing') : t('restocking.placeOrder') }}
          </button>
        </div>
        <div v-if="orderableCount === 0" class="empty-note">{{ t('restocking.empty') }}</div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>{{ t('restocking.table.include') }}</th>
                <th>{{ t('restocking.table.sku') }}</th>
                <th>{{ t('restocking.table.itemName') }}</th>
                <th>{{ t('restocking.table.trend') }}</th>
                <th class="num">{{ t('restocking.table.quantity') }}</th>
                <th class="num">{{ t('restocking.table.unitCost') }}</th>
                <th class="num">{{ t('restocking.table.lineTotal') }}</th>
                <th class="num">{{ t('restocking.table.leadTime') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.item_sku" :class="{ dimmed: row.excluded }">
                <td>
                  <input
                    type="checkbox"
                    :checked="!row.excluded"
                    :aria-label="row.item_sku"
                    @change="toggleExcluded(row.item_sku)"
                  />
                </td>
                <td><strong>{{ row.item_sku }}</strong></td>
                <td>{{ translateProductName(row.item_name) }}</td>
                <td>
                  <span :class="['badge', row.trend]">{{ t(`trends.${row.trend}`) }}</span>
                </td>
                <td class="num"><strong>{{ row.quantity }}</strong></td>
                <td class="num">{{ formatMoney(row.unit_cost, 2) }}</td>
                <td class="num">{{ formatMoney(row.lineTotal) }}</td>
                <td class="num">{{ row.lead_time_days }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'
import { useI18n } from '../composables/useI18n'

const TREND_RANK = { increasing: 0, stable: 1, decreasing: 2 }

export default {
  name: 'Restocking',
  setup() {
    const { t, currentCurrency, translateProductName } = useI18n()

    const currencySymbol = computed(() => (currentCurrency.value === 'JPY' ? '¥' : '$'))

    const loading = ref(true)
    const error = ref(null)
    const forecasts = ref([])
    const budget = ref(0)
    const excluded = ref(new Set())
    const submitting = ref(false)
    const submitError = ref(null)
    const orderResult = ref(null)

    const maxBudget = computed(() => {
      const total = forecasts.value.reduce(
        (sum, f) => sum + f.forecasted_demand * f.unit_cost, 0
      )
      return Math.ceil(total)
    })

    // Roughly 100 steps across the range, rounded down to a power of ten
    const budgetStep = computed(() => {
      const raw = maxBudget.value / 100
      if (raw <= 1) return 1
      return Math.pow(10, Math.floor(Math.log10(raw)))
    })

    const ranked = computed(() => {
      return [...forecasts.value].sort((a, b) => {
        const rankDiff = (TREND_RANK[a.trend] ?? 3) - (TREND_RANK[b.trend] ?? 3)
        if (rankDiff !== 0) return rankDiff
        return (b.forecasted_demand - b.current_demand) - (a.forecasted_demand - a.current_demand)
      })
    })

    const rows = computed(() => {
      let remainingBudget = budget.value
      return ranked.value.map(f => {
        const isExcluded = excluded.value.has(f.item_sku)
        let quantity = 0
        if (!isExcluded && f.unit_cost > 0) {
          const fullCost = f.forecasted_demand * f.unit_cost
          if (fullCost <= remainingBudget) {
            quantity = f.forecasted_demand
          } else {
            quantity = Math.max(0, Math.floor(remainingBudget / f.unit_cost))
          }
          remainingBudget -= quantity * f.unit_cost
        }
        return {
          ...f,
          excluded: isExcluded,
          quantity,
          lineTotal: quantity * f.unit_cost
        }
      })
    })

    const orderRows = computed(() => rows.value.filter(r => r.quantity > 0))
    const orderableCount = computed(() => orderRows.value.length)
    const allocated = computed(() => orderRows.value.reduce((sum, r) => sum + r.lineTotal, 0))
    const remaining = computed(() => Math.max(0, budget.value - allocated.value))
    const longestLeadTime = computed(() =>
      orderRows.value.reduce((max, r) => Math.max(max, r.lead_time_days), 0)
    )
    const canSubmit = computed(() => orderableCount.value > 0 && !submitting.value)

    const formatMoney = (value, digits = 0) => {
      return currencySymbol.value + Number(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })
    }

    const onBudgetInput = (event) => {
      const parsed = parseFloat(String(event.target.value).replace(/[^0-9.]/g, ''))
      const value = isNaN(parsed) ? 0 : parsed
      budget.value = Math.min(maxBudget.value, Math.max(0, Math.round(value)))
      event.target.value = budget.value.toLocaleString()
    }

    const toggleExcluded = (sku) => {
      const next = new Set(excluded.value)
      if (next.has(sku)) next.delete(sku)
      else next.add(sku)
      excluded.value = next
    }

    const loadData = async () => {
      try {
        loading.value = true
        forecasts.value = await api.getDemandForecasts()
        budget.value = Math.round(maxBudget.value / 2)
      } catch (err) {
        error.value = 'Failed to load demand forecasts: ' + err.message
      } finally {
        loading.value = false
      }
    }

    const placeOrder = async () => {
      if (!canSubmit.value) return
      submitting.value = true
      submitError.value = null
      orderResult.value = null
      try {
        orderResult.value = await api.createRestockingOrder({
          items: orderRows.value.map(r => ({ sku: r.item_sku, quantity: r.quantity })),
          budget: budget.value
        })
        excluded.value = new Set()
      } catch (err) {
        submitError.value = err.response?.data?.detail || t('restocking.error')
      } finally {
        submitting.value = false
      }
    }

    onMounted(loadData)

    return {
      t,
      loading,
      error,
      budget,
      maxBudget,
      budgetStep,
      rows,
      orderableCount,
      allocated,
      remaining,
      longestLeadTime,
      canSubmit,
      submitting,
      submitError,
      orderResult,
      currencySymbol,
      formatMoney,
      onBudgetInput,
      toggleExcluded,
      placeOrder,
      translateProductName
    }
  }
}
</script>

<style scoped>
.budget-controls {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.budget-slider {
  flex: 1;
  min-width: 0;
  accent-color: var(--color-accent);
}

.budget-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  height: var(--control-height);
  padding: 0 var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
}

.budget-input-wrap:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-ring);
}

.budget-symbol {
  color: var(--color-text-muted);
}

.budget-input {
  border: none;
  outline: none;
  width: 128px;
  text-align: right;
  font-family: inherit;
  font-size: var(--text-base);
  color: var(--color-text);
  background: transparent;
}

.empty-note {
  padding: var(--space-4) var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--text-base);
  border-bottom: 1px solid var(--color-border);
}

tr.dimmed td {
  color: var(--color-text-subtle);
}

@media (max-width: 599px) {
  .budget-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
  }
}
</style>

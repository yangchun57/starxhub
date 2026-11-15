<template>
  <div class="hx-table-wrap">
    <table class="hx-table">
      <thead>
        <tr>
          <th v-for="c in columns" :key="String(c.key)" :style="c.width ? { width: c.width } : undefined">
            {{ c.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i" :class="{ 'is-striped': striped && i % 2 === 1 }">
          <td v-for="c in columns" :key="String(c.key)">
            <span v-if="c.tone" class="hx-tag" :class="`hx-tag--${c.tone(row)}`">
              {{ c.render ? c.render(row) : String(row[c.key as keyof T]) }}
            </span>
            <span
              v-else
              :class="{
                'hx-link-cell': c.link,
                'hx-num-cell': typeof row[c.key as keyof T] === 'number',
                'hx-strong-cell': c.align === 'right',
              }"
            >{{ c.render ? c.render(row) : String(row[c.key as keyof T]) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <HxEmpty v-if="!rows.length" text="没有符合条件的记录" />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import HxEmpty from '@/components/base/HxEmpty.vue'
import type { TableColumn } from '@/types'
withDefaults(
  defineProps<{ columns: TableColumn<T>[]; rows: T[]; striped?: boolean }>(),
  { striped: true },
)
</script>

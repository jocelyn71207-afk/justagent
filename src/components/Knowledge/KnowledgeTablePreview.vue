<template>
  <div class="KnowledgeTablePreview">
    <table class="custom-table">
      <thead>
        <tr>
          <th v-for="header in data.headers" :key="header">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in data.rows" :key="ri">
          <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface TableData {
  headers: string[]
  rows: string[][]
}

defineProps<{ data: TableData }>()
</script>

<template>
  <div class="KnowledgeFlashcardPreview">
    <div class="flashcard-count">共 {{ cards.length }} 張題卡</div>
    <div class="flashcard-grid">
      <div class="flashcard" v-for="(card, i) in cards" :key="i">
        <div class="flashcard-q-row">
          <div class="flashcard-q-badge">Q</div>
          <div class="flashcard-q-text">{{ card.q }}</div>
        </div>
        <div class="flashcard-sep"></div>
        <div class="flashcard-a-row">
          <div class="flashcard-a-badge">A</div>
          <div class="flashcard-a-text">{{ card.a }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FlashcardItem {
  q: string
  a: string
}

defineProps<{ cards: FlashcardItem[] }>()
</script>

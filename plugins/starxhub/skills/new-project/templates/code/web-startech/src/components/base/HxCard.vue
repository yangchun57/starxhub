<template>
  <section class="hx-card">
    <div v-if="title" class="hx-card-head">
      <div class="hx-col">
        <span class="hx-card-title">{{ title }}</span>
        <span v-if="sub" class="hx-card-sub">{{ sub }}</span>
      </div>
      <slot name="extra">
        <a v-if="link" class="hx-card-link" :href="link">{{ linkText }}</a>
      </slot>
    </div>
    <div v-if="title" class="hx-divider" />
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ title?: string; sub?: string; link?: string; linkText?: string }>(),
  { linkText: '查看全部' },
)
</script>

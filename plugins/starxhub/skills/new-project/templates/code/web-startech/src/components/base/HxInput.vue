<template>
  <label class="hx-input-wrap" :style="width ? { width: width + 'px' } : undefined">
    <span v-if="iconName" class="hx-input-icon" v-html="icon(iconName)" />
    <input
      v-model="model"
      class="hx-input"
      :class="{ 'hx-input--with-icon': !!iconName }"
      :placeholder="placeholder"
      :type="type"
      :disabled="disabled"
    />
  </label>
</template>

<script setup lang="ts">
import { icon } from '@/assets/icons'
withDefaults(
  defineProps<{ placeholder?: string; iconName?: string; type?: string; width?: number; disabled?: boolean }>(),
  { placeholder: '请输入', type: 'text', disabled: false },
)
const model = defineModel<string>({ default: '' })
</script>

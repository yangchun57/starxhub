<template>
  <Teleport to="body">
    <div v-if="open" class="hx-modal-mask" @click.self="emit('close')">
      <div class="hx-modal hx-fade-in">
        <div class="hx-modal-head hx-row-between">
          <span>{{ title }}</span>
          <button class="hx-icon-btn" style="width: 28px; height: 28px" @click="emit('close')">
            <span v-html="icon('close')" />
          </button>
        </div>
        <div class="hx-modal-body"><slot /></div>
        <div class="hx-modal-foot">
          <slot name="footer">
            <HxButton variant="secondary" @click="emit('close')">取消</HxButton>
            <HxButton @click="emit('confirm')">确定</HxButton>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { icon } from '@/assets/icons'
import HxButton from './HxButton.vue'
withDefaults(defineProps<{ open?: boolean; title?: string }>(), { open: false, title: '提示' })
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

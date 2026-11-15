<template>
  <div class="hx-app">
    <AppSidebar />
    <div class="hx-main">
      <AppTopbar />
      <main class="hx-content">
        <router-view v-slot="{ Component }">
          <component :is="Component" class="hx-fade-in" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

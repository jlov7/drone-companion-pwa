<script setup lang="ts">
import { onMounted } from 'vue';
import BottomNav from './components/layout/BottomNav.vue';
import { ensureDefaultChecklists } from './db/checklistService';

onMounted(() => {
  ensureDefaultChecklists();
});
</script>

<template>
  <div id="app-container">
    <header class="app-header">
      <!-- Basic header, can be enhanced later -->
      <h1>Drone Companion</h1>
    </header>
    <main class="app-content">
      <router-view></router-view> <!-- Where routed components will be displayed -->
    </main>
    <BottomNav /> <!-- The bottom navigation bar -->
  </div>
</template>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* Add kid-friendly font later in global styles */
}

.app-header {
  background-color: #42b883; /* Vue green */
  color: white;
  padding: 15px 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5em;
}

.app-content {
  flex-grow: 1; /* Allows content to fill available space */
  /* Padding added within views to account for fixed nav */
}

/* Global styles might be needed in style.css for body margin etc. */
</style>

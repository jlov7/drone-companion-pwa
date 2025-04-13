<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item">
      <span class="icon">🏠</span>
      <span class="label">Home</span>
    </router-link>
    <router-link to="/drones" class="nav-item">
      <span class="icon">🚁</span>
      <span class="label">Drones</span>
    </router-link>
    <router-link to="/checklists" class="nav-item">
      <span class="icon">✅</span>
      <span class="label">Checklists</span>
    </router-link>
    <router-link to="/history" class="nav-item">
      <span class="icon">📜</span>
      <span class="label">History</span>
    </router-link>
    <router-link to="/stats" class="nav-item">
      <span class="icon">📊</span>
      <span class="label">Stats</span>
    </router-link>
    <router-link to="/achievements" class="nav-item">
      <span class="icon">🏆</span>
      <span class="label">Achieve</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
// No script logic needed for basic navigation yet
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px; /* Adjust height as needed */
  background-color: #f8f8f8; /* Light background */
  border-top: 1px solid #e7e7e7; /* Subtle top border */
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #777; /* Default color */
  font-size: 10px; /* Smaller label */
  flex-grow: 1;
  text-align: center;
  padding: 5px 0;
}

.nav-item .icon {
  font-size: 20px; /* Icon size */
  margin-bottom: 2px;
}

/* Style for the active route */
.nav-item.router-link-exact-active {
  color: #007aff; /* Active color (e.g., iOS blue) */
}
</style> 
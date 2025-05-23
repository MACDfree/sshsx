<script setup>
import { ref, onMounted } from 'vue';

const configPath = ref('');

onMounted(async () => {
  configPath.value = await window.configAPI.getConfigPathFromStore();
});
</script>

<template>
  <div>{{ configPath }}</div>
</template>

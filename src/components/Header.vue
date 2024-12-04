<template>
  <header class="header">
    <h2>{{ title }}</h2>
  </header>
</template>

<script>
export default {
  props: {
    title: String,
  },
};
</script>

<style scoped>
.header {
  text-align: center;
  margin-bottom: 20px;
}
.header h2 {
  font-size: 1.8em;
  color: #333;
}
</style>

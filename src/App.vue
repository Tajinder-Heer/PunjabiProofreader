<template>
  <div id="app">
    <h1>ਪੰਜਾਬੀ ਸ਼ਬਦਜੋੜ ਸੋਧਕ</h1>
    <div class="tab-buttons">
      <button :class="{ active: activeTab === 'manual' }" @click="activeTab = 'manual'">Manual</button>
      <button :class="{ active: activeTab === 'automatic' }" @click="activeTab = 'automatic'">Automatic</button>
    </div>

    <!-- Conditional Rendering based on activeTab -->
    <ManualProofreader v-if="activeTab === 'manual'" />
    <AutomaticProofreader v-if="activeTab === 'automatic'" />
  </div>
</template>

<script>
import ManualProofreader from './components/ManualProofreader.vue';
import AutomaticProofreader from './components/AutomaticProofreader.vue';
import dictionaryManager from './components/DictionaryManager';

export default {
  components: {
    ManualProofreader,
    AutomaticProofreader,
  },
  mounted (){
   dictionaryManager.loadDictionaryFromFirestore();
  },
  data() {
    return {
      activeTab: 'manual', // Default tab is 'manual'
    };
  },
};
</script>

<style>
/* Global Styles */
#app {
  max-width: 100%;
  margin: auto;
  text-align: center;
  background:  rgb(247, 248, 249);
}

.highlight {
  padding: 0 2px; /* Padding to make highlight more noticeable */
  cursor: pointer;
  text-decoration: underline wavy red;
}
.current-highlight {
  background: #dcc0ee;
  padding: 3px; /* Highlight current word */
}
.tab-buttons button {
  padding: 8px 12px;
  margin-right: 5px;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tab-buttons button.active {
  background-color: #b71c1c;
  color: white;
}

.tab-buttons button:hover {
  background-color: #c62828;
}
</style>

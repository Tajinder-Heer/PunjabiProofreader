<template>
  <div v-if="misspelledWords.length" class="correction-display">
    <h3>Misspelled Words:</h3>
    <ul>
      <li v-for="(word, index) in misspelledWords" :key="index">
        <span class="highlight" @click="suggestCorrection(word)">
          {{ word }}
        </span>
      </li>
    </ul>
  </div>
  <div v-else class="no-misspellings">
    <p>No errors found.</p>
  </div>
</template>

<script>
export default {
  props: {
    misspelledWords: Array,
  },
  methods: {
    suggestCorrection(word) {
      this.$emit('showSuggestions', word);
    },
  },
};
</script>

<style scoped>
/* Correction Display */
.correction-display {
  margin-top: 20px;
  width: 45%;
}

.correction-display h3 {
  font-size: 1.3em;
  color: #333;
  margin-bottom: 15px;
}

/* Highlighted Words */
.highlight {
  background-color: #ffd54f;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.highlight:hover {
  background-color: #ffb74d;
  transform: scale(1.05);
}

/* No Misspellings Message */
.no-misspellings {
  margin-top: 20px;
  color: #4caf50;
  font-size: 1.1em;
  font-style: italic;
}

/* List Styling */
ul {
  list-style-type: none;
  padding-left: 0;
}

li {
  margin-bottom: 10px;
}
</style>

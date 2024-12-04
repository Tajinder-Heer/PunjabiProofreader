<template>
  <div class="suggestions-popup">
    <div class="popup-content">
      <h4>Suggestions for "{{ word }}":</h4>
      <ul>
        <li v-for="(suggestion, index) in suggestions" :key="index" @click="selectSuggestion(suggestion)">
          {{ suggestion }}
        </li>
      </ul>
      <div class="popup-actions">
        <button class="cancel-btn" @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    word: String,
    suggestions: Array,
  },
  methods: {
    selectSuggestion(suggestion) {
      this.$emit('correct', suggestion);
    },
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.suggestions-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 300px;
  z-index: 10;
}

.popup-content h4 {
  margin-bottom: 15px;
}

ul {
  list-style-type: none;
  padding-left: 0;
}

ul li {
  padding: 8px;
  cursor: pointer;
}

ul li:hover {
  background-color: #f0f0f0;
}

.popup-actions {
  margin-top: 15px;
  text-align: center;
}

.cancel-btn {
  padding: 8px 15px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.cancel-btn:hover {
  background-color: #e53935;
}
</style>

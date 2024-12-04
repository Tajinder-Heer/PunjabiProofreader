<template>
  <input 
    type="text" 
    v-model="inputText" 
    @input="onInputChange" 
    placeholder="Type or paste text"
  />
</template>

<script>
export default {
  data() {
    return {
      inputText: '',  // Bind the input field to this data
    };
  },
  methods: {
    onInputChange(event) {
      this.$emit('input', event.target.value); // Emit the actual value
    }
  }
};
</script>


<style scoped>
textarea {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: vertical;
}
</style>

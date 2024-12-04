<template>
  <div class="manual-proofreader">
    <h2 class="title">Manual Proofreading</h2>
    
    <!-- Textarea for input -->
     
    <textarea v-model="text" placeholder="Enter Punjabi text..." class="text-input"></textarea>
    
    <!-- Check Text Button -->
    <button @click="proofreadText" class="check-button">Check Text</button>

    <!-- Unrecognized Words Section -->
    <div v-if="unrecognizedWords.length" class="unrecognized-words">
      <h3 class="section-title">Unrecognized Words:</h3>
       <p style="display: inline;">Total words in dictionary:</p>
        <h5 style="display: inline; color: green; margin-left: 8px;">{{ totalWords }}</h5>
        
        <!-- Recently added word -->
        <br> <br>
        <p v-if="recentWord" style="display: inline; font-weight: normal;">Recently added word:</p>
        <h5 v-if="recentWord" style="display: inline; color: green; margin-left: 8px;">{{ recentWord }}</h5><br>
      
      <!-- Table for displaying unrecognized words with fixed header -->
      <div class="table-container">
        <table class="word-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" @change="toggleSelectAll" :checked="selectAll" />
              </th>
              <th>Word</th>
              <th>                
                  
               
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(word, index) in unrecognizedWords" :key="index">
              <td>
                <input type="checkbox" v-model="selectedWords" :value="word" />
              </td>
              <td>
                <span class="highlight">{{ word }}</span>
              </td>
              <td>
                <button @click="addToDictionary(word)" class="add-button" title="Add to dictionary">+</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import DictionaryManager from '../components/DictionaryManager';
//import uploadDictionary from './uploadDictionary.js';

export default {
  data() {
    return {
      text: '',
      unrecognizedWords: [],
      selectedWords: [], // Stores selected words for bulk action
      selectAll: false,
      totalWords:null,
      recentWord:null  // Tracks the "Select All" checkbox
    };
  },
  mounted (){
  //uploadDictionary(); 
  this.totalWords= DictionaryManager.dictionary.size;
  },
  computed (){
    this.totalWords= DictionaryManager.dictionary.size;
    alert(DictionaryManager.recentWord);
    this.recentWord = DictionaryManager.recentWord;
  },
  methods: {
    proofreadText() {
      const words = this.text.split(/\s+/);      
      const punctuation = /[.,!?;(){}[\]":'<>। ""''“”|‘’!]/g;
      this.unrecognizedWords = words
        .map(word => word.replace(punctuation,'').normalize("NFC")) // Unicode support for all letters/numbers
        .filter(cleanWord => cleanWord !== '' && !DictionaryManager.isWordRecognized(cleanWord));
    },
    addToDictionary(word) {      
      DictionaryManager.addWord(word);
      this.proofreadText();      
      this.totalWords = DictionaryManager.dictionary.size;
      this.recentWord = word;      // Refresh the unrecognized words
    },
    addSelectedToDictionary() {
      this.selectedWords.forEach(word => {
        DictionaryManager.addWord(word);
      });
      this.selectedWords = []; // Clear selected words after adding them to the dictionary
      this.proofreadText(); // Refresh the unrecognized words list
    },
    toggleSelectAll() {
      this.selectAll = !this.selectAll;
      if (this.selectAll) {
        this.selectedWords = [...this.unrecognizedWords]; // Select all words
      } else {
        this.selectedWords = []; // Deselect all words
      }
    },
  },
};
</script>

<style scoped>
/* General Container */
.manual-proofreader {
  max-width: 700px;
  margin: auto;
  padding: 20px;
  text-align: center;
  font-family: 'Arial', sans-serif;
}

.title {
  font-size: 24px;
  margin-bottom: 20px;
}

.text-input {
  width: 100%;
  height: 120px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.check-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #0d47a1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.check-button:hover {
  background-color: #1565c0;
}

/* Table Container */
.table-container {
  max-height: 600px;
  overflow-y: auto;
  position: relative;
  margin-bottom: 100px;
}

/* Section for Unrecognized Words */
.unrecognized-words {
  margin-top: 20px;
}

.section-title {
  font-size: 18px;
  margin-bottom: 10px;
}

/* Table Styling */
.word-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.word-table th, .word-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.word-table th {
  background-color: #f1f1f1;
  position: sticky;
  top: 0;
  z-index: 2; /* Ensures header stays on top while scrolling */
}

.highlight { 
  text-decoration: none;
}

.add-button {
  background-color: #388e3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.add-button:hover {
  background-color: #2c6c29;
}

/* Bulk Add Button */
.bulk-add-button {
  padding: 10px 20px;
  background-color: #388e3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bulk-add-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.bulk-add-button:hover {
  background-color: #2c6c29;
}
</style>

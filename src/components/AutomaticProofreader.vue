<script>
import DictionaryManager from './DictionaryManager';

export default {
  data() {
    return {
      text: '', // The text input
      suggestions: [], // Suggestions for corrections
      currentWord: '', // Word currently being corrected
      currentWordIndex: -1, // Index of the current incorrect word being processed
      incorrectWords: [], 
      isProcessing:false,
      progress: 0,// List of incorrect words in the text
    };
  },
  methods: {
    updateText(event) {
      this.text = event.target.innerText; // Update the text with user input
    },
    async proofread() {
      this.isProcessing = true; 
      this.progress = 0; // Optional: Use a flag to show loading UI if needed
      // Run the async proofreadText method
      const correctedHtml = await DictionaryManager.proofreadTextAsync(
        this.text.normalize('NFC'),
        (progress) => {
          this.progress = progress; // Update progress in real-time
        }
      );
      // Update the DOM in one operation after processing
      this.$refs.editableDiv.innerHTML = correctedHtml;

      this.collectIncorrectWords();
      this.showNextIncorrectWord();
      this.$refs.editableDiv.scrollTop = 0;

      this.isProcessing = false; // Hide loading UI if used
    },
     collectIncorrectWords() {
      this.incorrectWords = Array.from(this.$refs.editableDiv.querySelectorAll('.highlight'));
    },
    showNextIncorrectWord() {
      // Remove previous highlight
      
      if (this.currentWordIndex >= 0 && this.currentWordIndex < this.incorrectWords.length) {
        this.incorrectWords[this.currentWordIndex].classList.remove('current-highlight');
      }
      if (this.incorrectWords.length > 0) {
        this.currentWordIndex++;
        if (this.currentWordIndex < this.incorrectWords.length) {
          const currentElement = this.incorrectWords[this.currentWordIndex];
          this.$refs.editableDiv.scrollTop = currentElement.offsetTop - this.$refs.editableDiv.offsetHeight / 2;
          currentElement.classList.add('current-highlight'); // Apply new highlight
          this.currentWord = currentElement.innerText;
          console.log("Getting sugessions");
          this.suggestions = DictionaryManager.getSuggestions(this.currentWord);
        } else {
          this.closeSuggestions();
        }
      }
    },
    applyCorrection(newWord) {
    const currentElement = this.incorrectWords[this.currentWordIndex];
    this.$refs.editableDiv.scrollTop = currentElement.offsetTop - this.$refs.editableDiv.offsetHeight / 2;

  // Extract the punctuation separately from the original text
  const originalText = currentElement.innerText;
  const punctuation = originalText.match(/\p{P}*$/u)?.[0] || '';  // Extract trailing punctuation

  // Replace the word while preserving punctuation
  currentElement.innerText = newWord + punctuation;
  // Update UI and proceed to the next incorrect word
  currentElement.classList.remove('highlight', 'current-highlight');
  this.text = this.$refs.editableDiv.innerText;
  this.showNextIncorrectWord();
}
,
    ignoreWord() {
   
      this.incorrectWords[this.currentWordIndex].classList.remove('highlight', 'current-highlight');
      this.showNextIncorrectWord();
    },
    ignoreAllOccurrences() {
     
      this.incorrectWords.forEach(wordElement => {
        if (wordElement.innerText === this.currentWord) {
          wordElement.classList.remove('highlight', 'current-highlight');
        }
      });
      this.showNextIncorrectWord();
    },
    changeAllOccurrences() {
      const replacementWord = this.suggestions[0];
     
      this.incorrectWords.forEach(wordElement => {
        if (wordElement.innerText === this.currentWord) {
          wordElement.innerText = replacementWord;
          wordElement.classList.remove('highlight', 'current-highlight');
        }
      });
      this.text = this.$refs.editableDiv.innerText;
      
      this.showNextIncorrectWord();
    },
    closeSuggestions() {
      if (this.currentWordIndex >= 0 && this.currentWordIndex < this.incorrectWords.length) {
        this.incorrectWords[this.currentWordIndex].classList.remove('current-highlight');
      }
      this.currentWord = '';
      this.suggestions = [];
      this.currentWordIndex = -1;
      this.incorrectWords = [];
    }
  }
};
</script>

<template>
  <h2 class="title"></h2>
  <div class="proofreader-container">
    <div class="left-section">
      <div
        contenteditable="true"
        ref="editableDiv"
        @input="updateText"
        class="text-input"
        placeholder="Enter text..."
      ></div>
        <div v-if="isProcessing" class="progress-container">
        <div class="progress-bar" :style="{ width: progress + '%' }">
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>

      <button v-else @click="proofread" class="check-btn">ਸਬਦ ਜੋੜ ਵੇਖੋ</button>
    </div>

    <div v-if="currentWordIndex !== -1" class="suggestions-popup">
      <div class="sugesstion-header">ਸੁਝਾਅ
      <button class="close-popup" @click="closeSuggestions">×</button>
      </div>
      <h4>
        ਗਲਤ ਸ਼ਬਦ:
        <span class="highlighted-word">{{ currentWord }}</span>
      </h4>
      <ul class="suggestions-list">
        <li v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
          <span class="suggestion-text"><div class="current-word">{{currentWord}}<i class="fa-solid fa-arrow-right"></i></div> {{ suggestion }}</span>
          <button @click="applyCorrection(suggestion)" class="replace-btn">ਬਦਲੋ</button>
        </li>
      </ul>
      <div class="suggestion-actions">
        <button @click="ignoreWord" class="secondary-btn">ਅਣਡਿੱਠ ਕਰੋ</button>
        <button @click="ignoreAllOccurrences" class="secondary-btn">ਸਾਰੇ ਅਣਡਿੱਠ ਕਰੋ</button>
        <button @click="changeAllOccurrences" class="primary-btn">ਸਾਰੇ ਬਦਲੋ</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.proofreader-container {
  display: flex;
  margin: 0 auto;
  padding: 2%;
  gap: 40px;
  max-width: 1200px;
  box-sizing: border-box;
}
.progress-container {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background-color: #07db4e; /* Your red theme color */
  width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white; /* Text color inside the progress bar */
  font-weight: bold;
  font-size: 14px;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  width: 100%;
  text-align: center;
  z-index: 1;
  color: rgb(18, 18, 18); /* If you want to show progress outside with black text */
}
.left-section {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.text-input {
  width: 100%;
  height: 450px;
  padding: 15px;
  border: 1px solid #ddd;
  overflow-y: auto;
  text-align: justify;
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #2d2544;
  background-color: white;
  border-radius: 8px;
}

.check-btn {
  margin-top: 20px;
  padding: 12px 20px;
  background-color: #b71c1c;
  color: white;
  font-size: 1.1em;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, transform 0.2s ease-in-out;
}

.check-btn:hover {
  background-color: #c92525;
  transform: translateY(-3px);
}

.suggestions-popup {
  background: #ffffff;
  border: 1px solid #e0e0e0;  
  width: 450px;
  max-height: 380px;
  overflow-y: auto;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}
.sugesstion-header{
  background: #535551;
  color: white;
  height: 50px;
  align-content: center;
  font-size: 26px;
}

.close-popup {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: transparent;
  border: none;
  color: #f3eded;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}

.close-popup:hover {
  transform: scale(1.2);
}

h4 {
  font-size: 1.2em;
  color: #333;
  margin-bottom: 10px;
}

.highlighted-word {
  font-weight: bold;
  color: #b71c1c;
  padding: 2px 5px;
  background-color: rgba(255, 229, 229, 0.6);
  border-radius: 5px;
}

.suggestions-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: #f9f9f9;
  margin-bottom: 6px;
  transition: background-color 0.3s ease, transform 0.2s ease-in-out;
  cursor: pointer;
  color: #333;
}

.current-word {
  position: relative;
  display: inline-block;
  font-weight: normal; /* Make the current word stand out */
   
  color: #da0808; /* Adjust color for visibility */
}

.fa-arrow-right {
  font-size: 0.8em; /* Slightly larger than text */
  margin-left: 5px;
  color:rgb(6, 150, 14); /* Space between the current word and the arrow */
}

.suggestion-text {
  font-size: 1em;
  color: #007BFF; /* A blue color for the suggestion */
  margin-left: 5px;
}

.replace-btn {
  background-color: #50b503;
  color: white;
  font-size: 0.9em;
  padding: 2px 10px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.replace-btn:hover {
  background-color: #34d146;
}

.suggestion-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.secondary-btn,
.primary-btn {
  padding: 5px 10px;
  border-radius: 0px;
  border: none;
  cursor: pointer;
  margin-left:5px;
  margin-right: 5px;
  transition: background-color 0.3s ease;
}

.secondary-btn {
  background-color: #d70c0c;
  color: #faf6f6;
}

.secondary-btn:hover {
  background-color: #ee5757;
}

.primary-btn {
  background-color: #50b503;
  color: white;
}

.primary-btn:hover {
  background-color: #25c946;
}
</style>

import { firestore, collection, getDocs, doc, setDoc, onSnapshot } from '../../firebaseStore';

class DictionaryManager {
  constructor() {
    this.dictionary = new Set();
    this.listenForWordChanges();
    this.recentWord = null;
  }

  // Listen for word changes in Firestore
  listenForWordChanges() {
    const dictionaryRef = collection(firestore, 'dictionary');
    console.log("Listening...");

    onSnapshot(dictionaryRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newWords = change.doc.data();
          const addedWords = Object.keys(newWords);
          const newUniqueWords = addedWords.filter(word => !this.dictionary.has(word));
          newUniqueWords.forEach(word => this.dictionary.add(word));         
        } else if (change.type === 'modified') {
          this.loadDictionaryFromFirestore();
        }
      });
    }, (error) => {
      console.error('Error listening to Firestore changes:', error);
    });
  }

  // Load dictionary from Firestore
  async loadDictionaryFromFirestore() {
    try {
      const dictionaryRef = collection(firestore, 'dictionary');
      const snapshot = await getDocs(dictionaryRef);
      const allWords = [];
      snapshot.docs.forEach(doc => {
        const wordsObject = doc.data();
        if (typeof wordsObject === 'object') {
          allWords.push(...Object.keys(wordsObject).map(word => word.normalize('NFC')));
        }
      });
      this.dictionary = new Set(allWords);
      console.log("Loaded dictionary from Firestore. Total words:", this.dictionary.size);
    } catch (error) {
      console.error("Error loading dictionary from Firestore:", error);
    }
  }

  // Save a new word to Firestore
  async saveDictionaryToFirestore(word) {
    try {
      const dictionaryRef = collection(firestore, 'dictionary');
      const snapshot = await getDocs(dictionaryRef);
      let docRef;
      let addedToExistingDoc = false;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const currentWords = Object.keys(data);

        if (currentWords.length < 20000) {
          if (currentWords.includes(word)) {
            alert(`Word "${word}" already exists in document with ID: ${docSnap.id}`);
            addedToExistingDoc = true;
            return;
          } else {
            docRef = docSnap.ref;
            addedToExistingDoc = true;
            break;
          }
        }
      }

      if (!addedToExistingDoc) {
        const newDocId = `wordDocument${snapshot.size + 1}`;
        docRef = doc(dictionaryRef, newDocId);
      }

      await setDoc(docRef, { [word]: true }, { merge: true });
      console.log(`Successfully added word "${word}" to Firestore`);
    } catch (error) {
      console.error("Error adding word to Firestore:", error);
    }
  }

  // Add a new word to the in-memory dictionary and Firestore
  async addWord(word) {
    word = word.normalize("NFC");
    this.dictionary.add(word);   
    await this.saveDictionaryToFirestore(word);
    this.recentWord = word;
  }

  // Check if word is recognized in the dictionary
  isWordRecognized(word) {    
    return this.dictionary.has(word.normalize("NFC"));
  }

  // Levenshtein distance algorithm to suggest similar words
  levenshteinDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
  
        // Penalize less for diacritic mismatches
        const isDiacritic = ch => /\u0A3E-\u0A4D/.test(ch); // Punjabi diacritic range
        const diacriticPenalty = isDiacritic(a[i - 1]) || isDiacritic(b[j - 1]) ? 0.5 : 1;
  
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // Deletion
          dp[i][j - 1] + 1, // Insertion
          dp[i - 1][j - 1] + cost * diacriticPenalty // Substitution
        );
      }
    }
  
    return dp[a.length][b.length];
  }
  
  

  // Get suggestions for a misspelled word
  getSuggestions(word) {
    const normalizedWord = word.normalize("NFC");  
    const suggestions = [...this.dictionary]
      .map(dictWord => ({
        word: dictWord,
        distance: this.levenshteinDistance(normalizedWord, dictWord.normalize("NFC")),
        isPrefixMatch: dictWord.startsWith(normalizedWord), // Match base structure
      }))
      .sort((a, b) => {
        // Prioritize prefix matches, then by distance
        if (a.isPrefixMatch && !b.isPrefixMatch) return -1;
        if (!a.isPrefixMatch && b.isPrefixMatch) return 1;
        return a.distance - b.distance;
      })
      .slice(0, 4)
      .map(s => s.word);
  
    return suggestions;
  }
  
  // Proofread text by highlighting unrecognized words
  async proofreadTextAsync(text, progressCallback) {
    const paragraphs = text.replace(/\n/g, '<br>').split(/(<p.*?>|<br>)/g);
    let correctedHtml = '';

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      if (paragraph.match(/<p.*?>|<br>/)) {
        correctedHtml += paragraph;
      } else {
        correctedHtml += await this.processParagraphAsync(paragraph);
      }

      // Update progress percentage after processing each paragraph
      if (progressCallback) {
        progressCallback(Math.floor(((i + 1) / paragraphs.length) * 100));
      }
    }

    return correctedHtml;
  }

  processParagraphAsync(paragraph) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const correctedParagraph = paragraph
          .split(/(\s+|[.,!?;(){}[\]":'<>। ""''“”|‘’])/g)
          .map((part) => {
            if (part.trim() === '' || /[.,!?;(){}[\]":'<>। ""''“”|‘’]/.test(part)) return part;
            return this.isWordRecognized(part)
              ? part
              : `<span class="highlight" title="Suggestions: ${this.getSuggestions(part).join(', ')}">${part}</span>`;
          })
          .join('');
        resolve(correctedParagraph);
      }, 0); // Yield control to UI to prevent lag
    });
  }

}
// Helper function to generate a random word

export default new DictionaryManager();


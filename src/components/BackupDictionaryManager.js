import { firestore, collection, getDocs, doc, setDoc, onSnapshot } from '../../firebaseStore';

class DictionaryManager {
  constructor() {
    this.dbName = 'dictionaryDB';
    this.storeName = 'words';
    this.db = null;
    this.dictionary = new Set();
    this.initIndexedDB();
    this.listenForWordChanges();
  }

  listenForWordChanges() {
    const dictionaryRef = collection(firestore, 'dictionary');
    console.log("Lisnening...");
  
    // Using onSnapshot to listen to the dictionary collection for changes
    onSnapshot(dictionaryRef, async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
      
        if (change.type === 'added') {
          const newWords = change.doc.data();  
          // Assuming 'words' is an object with word as keys
          const addedWords = Object.keys(newWords);              
          // Filter out words that are already in the dictionary
          const newUniqueWords = addedWords.filter(word => !this.dictionary.has(word));
  
          // Add the new unique words to the dictionary and IndexedDB
          if (newUniqueWords.length > 0) {
            newUniqueWords.forEach(word => {
              
              this.dictionary.add(word); 
              const transaction = this.db.transaction(this.storeName, 'readwrite');
              const store = transaction.objectStore(this.storeName);                           
                store.put({ word });           
            });  
            // Sync the new unique words with IndexedDB
           this.syncFirestoreToIndexedDB(newUniqueWords); // Pass the array of new words to the method
          }
        }
        if (change.type === 'modified') {
          this.loadDictionaryFromFirestore();
        }
      });
    }, (error) => {
      console.error('Error listening to Firestore changes:', error);
    });
  }  

  // Initialize IndexedDB
  initIndexedDB() {
    const request = indexedDB.open(this.dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'word' });
      }
    };

    request.onsuccess = (event) => {
      this.db = event.target.result;
      this.loadDictionaryFromIndexedDB();
    };

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
    };
  }

  // Load dictionary from IndexedDB
  loadDictionaryFromIndexedDB() {
    if (!this.db) return;

    const transaction = this.db.transaction(this.storeName, 'readonly');
    const store = transaction.objectStore(this.storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      const words = request.result;
      if (words.length > 0) {
        this.dictionary = new Set(words.map(wordObj => wordObj.word.normalize("NFC")));
        console.log('Loaded dictionary from IndexedDB');
      } else {
        console.log('No dictionary in IndexedDB, loading from Firestore...');
        this.loadDictionaryFromFirestore();
      }
    };

    request.onerror = (event) => {
      console.error('Error loading from IndexedDB:', event.target.error);
    };
  }
  clearIndexedDB() {   
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB is not initialized');
  
      const transaction = this.db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const clearRequest = store.clear();
  
      clearRequest.onsuccess = () => {
        console.log('Cleared IndexedDB store');
        resolve();
      };
  
      clearRequest.onerror = (event) => {
        console.error('Error clearing IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  // Load dictionary from Firestore
async loadDictionaryFromFirestore() {
  try {
    const dictionaryRef = collection(firestore, 'dictionary');
    // Fetch all documents at once
    const snapshot = await getDocs(dictionaryRef);
    let allWords = [];
    if (!snapshot.empty) {    
      snapshot.docs.forEach(doc => {
        const wordsObject = doc.data();
        if (typeof wordsObject === 'object') {
          allWords.push(...Object.keys(wordsObject).map(word => word.normalize('NFC')));
        }
      });
    }
    
    this.dictionary = new Set(allWords);
    console.log("Loaded dic count->", this.dictionary.size);


    // Clear IndexedDB and sync the fresh copy from Firestore
    this.clearIndexedDB()
      .then(() => this.syncFirestoreToIndexedDB(allWords))
      .catch(error => console.error('Error clearing IndexedDB:', error));

  } catch (error) {
    console.error("Error loading dictionary from Firestore:", error);
  }
}

// Sync fresh data from Firestore to IndexedDB
syncFirestoreToIndexedDB(words) {
  if (!this.db) return;
  const transaction = this.db.transaction(this.storeName, 'readwrite');
  const store = transaction.objectStore(this.storeName);

  words.forEach((word) => {
    store.put({ word });
  });

  transaction.oncomplete = () => {
    console.log('Sync completed between Firestore and IndexedDB');
  };

  transaction.onerror = (event) => {
    console.error('Error syncing to IndexedDB:', event.target.error);
  };
}

  // Save dictionary to IndexedDB
  saveDictionaryToIndexedDB(word) {
    if (!this.db) return;

    const transaction = this.db.transaction(this.storeName, 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.put({ word });
    transaction.oncomplete = () => {
     
    };

    transaction.onerror = (event) => {
      console.error('Error adding word to IndexedDB:', event.target.error);
    };
  }

  async saveDictionaryToFirestore(word) {
    try {
      const dictionaryRef = collection(firestore, 'dictionary');     
      // Fetch all documents from the dictionary collection
      const snapshot = await getDocs(dictionaryRef);
    
      let docRef;
      let addedToExistingDoc = false;
    
      // Use a for...of loop to handle asynchronous control flow
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const currentWords = Object.keys(data); // Get all current fields (words)

        // Check if the document has fewer than 20,000 words and does not already contain the word
        console.log("dic Count: ",currentWords.length);
        if (currentWords.length < 20000) {
         
          if (currentWords.includes(word)) {
            
            // If the word exists, show an alert and set addedToExistingDoc to true
            alert(`Word "${word}" already exists in document with ID: ${docSnap.id}`);
            addedToExistingDoc = true;
            return; // Exit the loop if the word is found
          } else {
            // Add the new word as a field in the document
            docRef = docSnap.ref; // Set the document reference to update
            addedToExistingDoc = true;
            console.log(`Adding word "${word}" to document with ID: ${docSnap.id}`);
            break; // Exit the loop after finding an eligible document to add the word
          }
        }
      }
    
      // If the word wasn't added to any existing document, create a new document
      if (!addedToExistingDoc) {
        const newDocId = `wordDocument${snapshot.size + 1}`;
        docRef = doc(dictionaryRef, newDocId);
        console.log(`Creating a new document with ID: ${newDocId} for word "${word}"`);
      }
    
      // Save the word as a new field in the selected or newly created document
      await setDoc(docRef, { [word]: true }, { merge: true });
      console.log(`Successfully added word "${word}" to Firestore`);
    
    } catch (error) {
      console.error("Error adding word to Firestore:", error);
    }
    
  }
  

  // Add a new word to both IndexedDB and Firestore
  async addWord(word) {
    word = word.normalize("NFC");
        this.dictionary.add(word);  
        console.log("Total words:->", this.dictionary.size);      
       this.saveDictionaryToIndexedDB(word);
    await this.saveDictionaryToFirestore(word);    
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
  proofreadText(text) {
    let structuredText = text.replace(/\n/g, '<br>').replace(/(\r?\n|\r)/g, '\n');
    const paragraphs = structuredText.split(/(<p.*?>|<br>)/g);

    return paragraphs
      .map(paragraph => {
        if (paragraph.match(/<p.*?>|<br>/)) return paragraph;
        return paragraph
          .split(/(\s+)/)
          .map(word => {
            if (word.trim() === '') return word;

            if (this.isWordRecognized(word)) {
              return word;
            } else {
              const suggestions = this.getSuggestions(word).join(', ');
              return `<span class="highlight" title="Suggestions: ${suggestions}">${word}</span>`;
            }
          })
          .join('');
      })
      .join('');
  }
}
// Helper function to generate a random word

export default new DictionaryManager();

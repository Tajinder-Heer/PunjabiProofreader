import { firestore, collection, doc, setDoc, getDocs } from '../../firebaseStore';
import dictionaryJson from '../assets/dictionary';

const uploadDictionary = async () => {
  const dictionaryRef = collection(firestore, 'dictionary');
  const maxFieldsPerDoc = 20000; // Maximum fields per document
  let currentDocIndex = 1; // Default starting document index
  let currentFieldCount = 0;
  let wordBatch = {}; // Object to store words as fields for the current document

  try {
    // Step 1: Check for existing documents to find the current document index
    const snapshot = await getDocs(dictionaryRef);
    if (!snapshot.empty) {
      // If there are existing documents, find the highest document index
      snapshot.forEach((docSnap) => {
        const docId = docSnap.id;
        if (docId.startsWith('wordDocument')) {
          const docNumber = parseInt(docId.replace('wordDocument', ''), 10);
          if (docNumber >= currentDocIndex) {
            currentDocIndex = docNumber + 1; // Start from the next document number
          }
        }
      });
    }

    // Step 2: Normalize and store words in a Set to remove duplicates
    const uniqueWords = new Set(
      dictionaryJson.map(word => word.normalize("NFC"))
    );

    // Step 3: Start uploading unique words in batches of maxFieldsPerDoc
    for (const normalizedWord of uniqueWords) {
      // Add the word as a field in the current batch
      wordBatch[normalizedWord] = true;
      currentFieldCount++;

      // If we've reached the max field count for this document, save it and reset
      if (currentFieldCount >= maxFieldsPerDoc) {
        const docId = `wordDocument${currentDocIndex}`; // Document ID
        await setDoc(doc(dictionaryRef, docId), wordBatch); // Save current batch to Firestore

        console.log(`Uploaded ${maxFieldsPerDoc} words as fields in document ${docId}.`);

        // Reset for the next document
        currentDocIndex++;
        currentFieldCount = 0;
        wordBatch = {}; // Reset the batch
      }
    }

    // Save any remaining words that didn't fill up to maxFieldsPerDoc in a new document
    if (currentFieldCount > 0) {
      const docId = `wordDocument${currentDocIndex}`;
      await setDoc(doc(dictionaryRef, docId), wordBatch);
      console.log(`Uploaded remaining ${currentFieldCount} words as fields in document ${docId}.`);
    }

  } catch (error) {
    console.error('Error uploading dictionary:', error);
  }
};

export default uploadDictionary;

// proofreadWorker.js
importScripts('./DictionaryManager.js');

self.onmessage = function (e) {
  const { text, chunkSize } = e.data;
  const totalChunks = Math.ceil(text.length / chunkSize);
  let correctedText = '';
  let progress = 0;

  for (let i = 0; i < totalChunks; i++) {
    const chunk = text.slice(i * chunkSize, (i + 1) * chunkSize);
    correctedText += DictionaryManager.proofreadText(chunk);
    progress = Math.floor(((i + 1) / totalChunks) * 100);
    self.postMessage({ type: 'progress', progress });
  }

  self.postMessage({ type: 'result', correctedText });
  self.close();
};

import init from './utils/pinecone.js';
const idx = init();
idx.describeIndexStats()
   .then(s => console.log('✅ OK', s))
   .catch(e => console.error('❌ FAIL', e.message));

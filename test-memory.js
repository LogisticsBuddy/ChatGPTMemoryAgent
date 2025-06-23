import axios from 'axios';

const baseUrl = 'http://localhost:3000'; // ⬅️ Change to your Render URL if deployed

const testData = {
  id: 'woody',
  text: 'Elena Marie Hernandez, born 04/05/2002, nickname Selena.',
  metadata: {
    type: 'person',
    nickname: 'Selena',
    dob: '2002-04-05'
  }
};

const query = 'What is Selena’s birthday?';

const runTest = async () => {
  try {
    console.log('📝 Storing memory...');
    const storeRes = await axios.post(`${baseUrl}/remember`, testData);
    console.log('✅ Store Response:', storeRes.data);

    console.log('🔍 Querying memory...');
    const recallRes = await axios.post(`${baseUrl}/recall`, {
      id: testData.id,
      query
    });

    console.log('✅ Recall Response:', recallRes.data);
  } catch (err) {
    console.error('❌ Test failed:', err?.response?.data || err.message);
  }
};

runTest();

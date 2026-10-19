import React from 'react';
import REIForm from './components/REIForm';

function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>AI Powered Funding - REI Form</h1>
      
      {/* This displays your form component */}
      <REIForm />
    </div>
  );
}

export default App;

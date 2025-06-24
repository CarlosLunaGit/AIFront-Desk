import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Initialize MSW
async function enableMocking() {
  // Check if mocking is enabled via environment variable
  const shouldMock = process.env.REACT_APP_ENABLE_MOCK_API === 'true';
  console.log('shouldMock:', shouldMock, process.env.REACT_APP_ENABLE_MOCK_API);
  
  if (!shouldMock) {
    console.log('Mock API is disabled. Using real API endpoints.');
    return;
  }

  if (process.env.NODE_ENV !== 'development') {
    console.log('Mock API is only available in development mode.');
    return;
  }

  try {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    });
    console.log('Mock API is enabled. Using mock endpoints.');
  } catch (error) {
    console.error('Failed to start mock service worker:', error);
  }
}

// Start the app
enableMocking().then(() => {
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

console.log('Rendering App...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import formbricks from '@formbricks/js';

const workspaceId = import.meta.env.VITE_FORMBRICKS_WORKSPACE_ID;
if (workspaceId) {
  formbricks
    .setup({
      workspaceId,
      appUrl: 'https://app.formbricks.com',
    })
    .then(() => console.debug('🧱 Formbricks initialized'))
    .catch((err) => console.error('🧱 Formbricks setup failed', err));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

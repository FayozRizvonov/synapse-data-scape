import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AIAssistantProvider } from './hooks/useAIAssistant.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AIAssistantProvider>
        <App />
      </AIAssistantProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

// main.jsx (or main.tsx)
import 'monaco-editor/min/vs/editor/editor.main.css';
import './index.css';   // *then* your App.css/index.css
import App from './App';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(<App />);
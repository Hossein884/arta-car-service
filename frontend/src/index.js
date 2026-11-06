import React from 'react';
import ReactDOM from 'react-dom/client';
import 'vazirmatn/Vazirmatn-font-face.css';   // فونت وزیرمتن (از داخل پروژه، بدون نیاز به اینترنت)
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

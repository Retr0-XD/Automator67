import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="flex gap-8 justify-center mb-8">
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1 className="text-4xl font-bold mb-4">Vite + React</h1>
        <div className="card bg-card text-card-foreground rounded-lg border border-border">
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            count is {count}
          </button>
          <p className="mt-4">
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs mt-8">Click on the Vite and React logos to learn more</p>
      </div>
    </div>
  );
}

export default App;

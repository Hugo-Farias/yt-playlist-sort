import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";

function App() {
  const [count, setCount] = useState(0);

  // TODO: Write the settings for the app
  // hide/show dates etc...
  return (
    <>
      <div className="w-96 border-red-400">
        <a href="https://wxt.dev" target="_blank" rel="noopener">
          <img src={wxtLogo} className="bg-blue-700" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button
          type="button"
          onClick={() => setCount((count: number) => count + 1)}
          className="bg-red-700"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p>
    </>
  );
}

export default App;

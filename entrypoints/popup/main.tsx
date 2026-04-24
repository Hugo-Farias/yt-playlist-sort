import { render } from "preact";
import { StrictMode } from "preact/compat";
import App from "./App.tsx";
import "./global.css";

const rootElement = document.getElementById("root");

if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => console.clear());
}

if (!rootElement) {
  throw new Error("Root element not found");
}

render(
  <StrictMode>
    <App />
  </StrictMode>,
  rootElement,
);

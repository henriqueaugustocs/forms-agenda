import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureUtms } from "./lib/utm.ts";

captureUtms();

createRoot(document.getElementById("root")!).render(<App />);

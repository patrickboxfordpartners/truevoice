import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";

initPostHog();

createRoot(document.getElementById("root")!).render(<App />);

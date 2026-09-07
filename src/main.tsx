import { createRoot } from "react-dom/client";
import { ConvexProvider } from "convex/react";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";
import { convex } from "./lib/convex";

initPostHog();

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);

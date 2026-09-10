import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AnalyticsConsent from './components/AnalyticsConsent';
import { initializeAnalytics } from "./analytics";
import "./index.css";

initializeAnalytics();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <AnalyticsConsent />
  </StrictMode>,
);

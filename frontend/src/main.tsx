import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loadWebsiteContent } from "./websiteContent";
import AnalyticsConsent from './components/AnalyticsConsent';
import { initializeAnalytics } from "./analytics";
import "./index.css";

initializeAnalytics();

await loadWebsiteContent();
const { default: App } = await import("./App");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <AnalyticsConsent />
  </StrictMode>,
);

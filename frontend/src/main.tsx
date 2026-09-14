import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loadWebsiteContent } from "./websiteContent";
import AnalyticsConsent from './components/AnalyticsConsent';
import { initializeAnalytics } from "./analytics";
import "./index.css";

initializeAnalytics();

import App from "./App";

const root = createRoot(document.getElementById("root")!);
function renderApp() {
  root.render(
    <StrictMode>
      <App />
      <AnalyticsConsent />
    </StrictMode>,
  );
}

renderApp();
void loadWebsiteContent().then(renderApp);

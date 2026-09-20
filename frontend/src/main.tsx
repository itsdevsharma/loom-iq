import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loadWebsiteContent } from "./websiteContent";
import AnalyticsConsent from './components/AnalyticsConsent';
import SiteLoadingBar from './components/SiteLoadingBar';
import { initializeAnalytics } from "./analytics";
import { installApiLoadingTracker } from './apiLoading';
import "./index.css";

installApiLoadingTracker();
initializeAnalytics();

import App from "./App";

const root = createRoot(document.getElementById("root")!);
function renderApp() {
  root.render(
    <StrictMode>
      <App />
      <AnalyticsConsent />
      <SiteLoadingBar />
    </StrictMode>,
  );
}

renderApp();
void loadWebsiteContent().then(renderApp);

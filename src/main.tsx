import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import { env } from "@/lib/env";
import "@/styles/tokens.css";
import "@/styles/index.css";
import "@/styles/components.css";
import "@/styles/layout.css";
import "@/styles/claim-flow.css";

async function prepareApp() {
  if (env.enableMocks) {
    const { worker } = await import("@/mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    });
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

prepareApp().catch((error: unknown) => {
  console.error("The application could not start.", error);
  const root = document.getElementById("root");
  if (root) root.textContent = "The application could not start. Please refresh the page.";
});

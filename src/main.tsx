// MUST be the first import: captures the Trello return token from the URL
// fragment before the router initializes and strips it.
import "./lib/trello-return.ts";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import { initTheme } from "./lib/theme.ts";
import router from "./router/index.tsx";

initTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
  </StrictMode>
);

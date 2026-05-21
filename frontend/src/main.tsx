import React from "react";
import { createRoot } from "react-dom/client";
import {
  HotkeysProvider,
  QueryProvider,
  ThemeProvider,
} from "@/components/providers";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components";
import { BaseLayout } from "@/components/layout";
import "@fontsource/inter";
import "@fontsource/jetbrains-mono";
import "react18-json-view/src/style.css";
import "@/style.css";

import { App, EnvironmentsPage } from "./pages";

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <HotkeysProvider>
          <BrowserRouter>
            <BaseLayout.AppShell>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/environments" element={<EnvironmentsPage />} />
              </Routes>
            </BaseLayout.AppShell>
          </BrowserRouter>

          <Toaster />
        </HotkeysProvider>
      </QueryProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

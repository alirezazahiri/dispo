import App from "@/App";
import React from "react";
import { createRoot } from "react-dom/client";
import { HotkeysProvider, ThemeProvider } from "@/components/providers";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components";
import "@fontsource/inter";
import "@/style.css";

const container = document.getElementById("root");

const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <HotkeysProvider>
        <BrowserRouter>
          <Routes>
            <Route index element={<App />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </HotkeysProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

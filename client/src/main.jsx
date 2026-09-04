import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import "./utils/axiosSetup";
import SearchProvider from "./context/SearchContext";
import LanguageProvider from "./context/LanguageContext";
import ThemeProvider from "./context/ThemeContext";
import MusicPlayerProvider from "./context/MusicPlayerContext";
import ToastProvider from "./context/ToastContext";
import InAppBrowserProvider from "./context/InAppBrowserContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <SearchProvider>
            <MusicPlayerProvider>
              <InAppBrowserProvider>
                <App />
              </InAppBrowserProvider>
            </MusicPlayerProvider>
          </SearchProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);
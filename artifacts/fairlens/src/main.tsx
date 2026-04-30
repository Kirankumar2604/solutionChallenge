import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Prefer an env-provided API URL (Vite: VITE_API_URL). Fall back to the
// Render backend URL used in the deployed environment. Also allow a
// runtime override via `window.__API_URL` for platforms (like Vercel)
// that may not expose build-time envs to the client bundle.
const buildTimeApiUrl = import.meta.env.VITE_API_URL;
const runtimeApiUrl = typeof window !== "undefined" && (window as any).__API_URL;
const apiUrl = buildTimeApiUrl ?? runtimeApiUrl ?? "https://solutionchallenge-b817.onrender.com";
setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);

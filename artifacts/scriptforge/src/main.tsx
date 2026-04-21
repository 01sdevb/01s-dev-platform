import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth-token";

const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (rawApiUrl) {
  // Strip a trailing "/api" if it was accidentally included in the env var,
  // because the OpenAPI spec already prefixes every path with /api.
  const cleaned = rawApiUrl.replace(/\/+$/, "").replace(/\/api$/, "");
  setBaseUrl(cleaned);
}

setAuthTokenGetter(() => getAuthToken());

createRoot(document.getElementById("root")!).render(<App />);

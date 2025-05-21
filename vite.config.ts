import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    allowedHosts: ["fc0d-2402-800-61ae-d1e-1c15-9342-1d56-ff3d.ngrok-free.app"],
    host: "0.0.0.0",
  },
  plugins: [react()],
});

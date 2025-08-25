import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let devTagger: any = null;
  if (mode === 'development') {
    try {
      const mod = await import('lovable-tagger');
      devTagger = mod.componentTagger?.();
    } catch (err) {
      // Plugin is optional in non-local environments
      devTagger = null;
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      devTagger,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

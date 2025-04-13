import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config'; // Import the main Vite config

// Merge the main Vite config with specific test overrides
export default mergeConfig(viteConfig, defineConfig({
  test: {
    // Override or add specific test configurations here
    testTimeout: 15000, // Keep the increased timeout
    // environment: 'happy-dom', // Already defined in vite.config.ts
    // globals: true, // Already defined in vite.config.ts
  },
})); 
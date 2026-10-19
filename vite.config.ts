import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  build:
    mode === 'library'
      ? {
          outDir: 'dist',
          lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
          rollupOptions: {
            external: (id: string) =>
              /^(react(?:-dom)?(?:\/|$)|@radix-ui\/|react-day-picker(?:\/|$))/.test(id),
          },
        }
      : { outDir: 'dist-demo', rollupOptions: { input: 'showcase/index.html' } },
}));

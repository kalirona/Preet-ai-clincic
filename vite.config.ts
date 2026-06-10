import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    ssr: {
      noExternal: [],
      external: [
        'openai', 'stripe', 'zod', '@google/genai', 'express',
        'express-rate-limit', 'multer', 'nodemailer', 'axios',
        '@supabase/supabase-js', 'dotenv'
      ],
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          widget: path.resolve(__dirname, 'src/widget.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === 'widget' ? 'widget.js' : 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
        external: [
          'openai', 'stripe', 'zod', '@google/genai', 'express',
          'express-rate-limit', 'multer', 'nodemailer',
          '@supabase/supabase-js', 'dotenv'
        ],
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

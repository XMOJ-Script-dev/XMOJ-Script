import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'XMOJ',
        namespace: 'https://github.com/XMOJ-Script-dev/XMOJ-Script',
        version: '2.2.1',
        description: 'XMOJ增强脚本',
        author: 'XMOJ-Script-dev',
        match: ['*://*.xmoj.tech/*'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=xmoj.tech',
        grant: ['GM_xmlhttpRequest'],
      },
      build: {
        fileName: 'XMOJ.user.js',
      },
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'XMOJ.user.js',
        format: 'iife',
        globals: {
          $: '$',
          marked: 'marked',
          jquery: 'jQuery',
          codemirror: 'CodeMirror',
          'file-saver': 'saveAs',
          jszip: 'JSZip',
          'crypto-js': 'CryptoJS',
          'diff-match-patch': 'diff_match_patch',
          dompurify: 'DOMPurify',
        },
      },
      external: [
        '$',
        'codemirror',
        'crypto-js',
        'diff-match-patch',
        'dompurify',
        'file-saver',
        'jquery',
        'marked',
        'jszip',
      ],
    },
  },
});

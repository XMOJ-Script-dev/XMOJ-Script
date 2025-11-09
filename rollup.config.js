import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { readFileSync } from 'fs';

// Read the original userscript header
const originalScript = readFileSync('./XMOJ.user.js', 'utf-8');
const headerMatch = originalScript.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
const header = headerMatch ? headerMatch[0] : '';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/XMOJ.user.js',
    format: 'iife',
    banner: header + '\n',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
  ],
};

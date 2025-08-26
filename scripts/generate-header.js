import fs from 'fs';
import path from 'path';

const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
const legacyJs = fs.readFileSync(path.resolve(process.cwd(), 'src/legacy.js'), 'utf-8');
const distPath = path.resolve(process.cwd(), 'dist/XMOJ.user.js');
const distCode = fs.readFileSync(distPath, 'utf-8');

const header = `// ==UserScript==
// @name         ${packageJson.name}
// @version      ${packageJson.version}
// @description  ${packageJson.description}
// @author       ${packageJson.author}
// @namespace    https://github.com/XMOJ-Script-dev/XMOJ-Script
${legacyJs.match(/(\/\/ @match.*\n)/g).join('')}${legacyJs.match(/(\/\/ @require.*\n)/g).join('')}${legacyJs.match(/(\/\/ @grant.*\n)/g).join('')}${legacyJs.match(/(\/\/ @homepage.*\n)/g).join('')}${legacyJs.match(/(\/\/ @supportURL.*\n)/g).join('')}${legacyJs.match(/(\/\/ @connect.*\n)/g).join('')}${legacyJs.match(/(\/\/ @license.*\n)/g).join('')}${legacyJs.match(/(\/\/ @icon.*\n)/g).join('')}// ==/UserScript==
`;

fs.writeFileSync(distPath, header + '\n' + distCode);

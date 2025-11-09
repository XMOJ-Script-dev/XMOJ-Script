import js from "@eslint/js";
import globals from "globals";
import security from "eslint-plugin-security";

export default [
    js.configs.recommended,
    security.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                // Userscript globals
                GM_addStyle: "readonly",
                GM_getValue: "readonly",
                GM_setValue: "readonly",
                GM_deleteValue: "readonly",
                GM_listValues: "readonly",
                GM_xmlhttpRequest: "readonly",
                GM_registerMenuCommand: "readonly",
                GM_unregisterMenuCommand: "readonly",
                GM_notification: "readonly",
                GM_setClipboard: "readonly",
                GM_info: "readonly",
                unsafeWindow: "readonly",
                // Project globals
                bootstrap: "readonly",
                Swal: "readonly",
                marked: "readonly",
                DOMPurify: "readonly",
                Diff2Html: "readonly",
                Turndown: "readonly",
                hljs: "readonly",
                katex: "readonly",
                renderMathInElement: "readonly",
            },
        },
        rules: {
            // Enforce strict equality
            "eqeqeq": ["error", "always"],
            // Disallow var, prefer const/let
            "no-var": "error",
            "prefer-const": "warn",
            // Security best practices
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-new-func": "error",
            // Code quality
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-console": "off", // Allow console for userscripts
            "curly": ["error", "all"],
            "brace-style": ["error", "1tbs"],
            // Best practices
            "no-throw-literal": "error",
            "prefer-promise-reject-errors": "error",
            "require-await": "warn",
            "no-return-await": "error",
            // Style consistency
            "quotes": ["error", "double", { "avoidEscape": true }],
            "semi": ["error", "always"],
            "comma-dangle": ["error", "always-multiline"],
            "indent": ["error", 4, { "SwitchCase": 1 }],
            "max-len": ["warn", { "code": 120, "ignoreUrls": true, "ignoreStrings": true }],
        },
    },
    {
        files: ["Update/**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
        },
    },
    {
        ignores: [
            "node_modules/",
            "dist/",
            "build/",
            "*.min.js",
            "backend/**",
        ],
    },
];

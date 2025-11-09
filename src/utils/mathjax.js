/**
 * MathJax rendering utilities
 */

/**
 * Render MathJax on the page
 */
export let RenderMathJax = async () => {
    try {
        if (document.getElementById("MathJax-script") === null) {
            var ScriptElement = document.createElement("script");
            ScriptElement.id = "MathJax-script";
            ScriptElement.type = "text/javascript";
            ScriptElement.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.0.5/es5/tex-chtml.js";
            document.body.appendChild(ScriptElement);
            await new Promise((Resolve) => {
                ScriptElement.onload = () => {
                    Resolve();
                };
            });
        }
        if (typeof MathJax !== 'undefined') { //If there is a Math expression
            MathJax.startup.input[0].findTeX.options.inlineMath.push(["$", "$"]);
            MathJax.startup.input[0].findTeX.getPatterns();
            MathJax.typeset();
        }
    } catch (e) {
        console.error(e);
    }
};

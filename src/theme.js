const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

const applyTheme = (theme) => {
    document.querySelector("html").setAttribute("data-bs-theme", theme);
    localStorage.setItem("UserScript-Setting-DarkMode", theme === "dark" ? "true" : "false");
};

const applySystemTheme = (e) => applyTheme(e.matches ? "dark" : "light");

export const initTheme = () => {
    const saved = localStorage.getItem("UserScript-Setting-Theme") || "auto";
    if (saved === "auto") {
        applyTheme(prefersDark.matches ? "dark" : "light");
        prefersDark.addEventListener("change", applySystemTheme);
    } else {
        applyTheme(saved);
        prefersDark.removeEventListener("change", applySystemTheme);
    }
};

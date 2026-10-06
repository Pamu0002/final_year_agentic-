export const THEME_STORAGE_KEY = "agentdine-theme";
export const THEME_CHANGE_EVENT = "agentdine-theme-change";

// Runs before the page paints so a saved dark theme never flashes light.
// This is static code, not interpolated user input.
export const THEME_INIT_SCRIPT = `(()=>{try{document.documentElement.classList.toggle('dark',localStorage.getItem('${THEME_STORAGE_KEY}')==='dark')}catch{}})()`;

export function getDarkMode() {
  return document.documentElement.classList.contains("dark");
}

export function toggleTheme() {
  const dark = !getDarkMode();
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // The switch still works when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeToTheme(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    document.documentElement.classList.toggle("dark", event.newValue === "dark");
    onChange();
  };
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getServerDarkMode() {
  return false;
}

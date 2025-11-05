// lib/ensureWebComponentsOnce.ts
export function ensureWebComponentsOnce() {
  // Guard common TinyMCE custom elements
  const names = ["mce-autosize-textarea"];
  for (const name of names) {
    try {
      // If already defined, skip any re-definitions by stubbing global flags your loader checks.
      if (customElements.get(name)) {
        (window as any).__wcAlreadyDefined__ = true;
      }
    } catch { /* no-op */ }
  }
}

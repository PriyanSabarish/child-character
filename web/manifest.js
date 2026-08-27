/**
 * Loads and validates the basic structure of a character manifest.
 * @param {string} url - Path to manifest.json
 * @returns {Promise<Object>}
 */
export async function loadManifest(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load manifest (${res.status} ${res.statusText})`);
  }

  const manifest = await res.json();

  // Basic runtime contract assertion
  const required = ["version", "canvas", "slots", "sprites", "base"];
  for (const field of required) {
    if (!(field in manifest)) {
      throw new Error(`Invalid manifest: missing required field '${field}'`);
    }
  }

  return manifest;
}
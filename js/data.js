let cache = null;

export function loadListings() {
  if (!cache) {
    cache = fetch("data/properties.json").then(async (response) => {
      if (!response.ok) {
        throw new Error("The sample catalogue could not be loaded.");
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.properties)) {
        throw new Error("The sample catalogue is not in the expected shape.");
      }
      return payload.properties;
    });
  }
  return cache;
}

export function clearListingsCache() {
  cache = null;
}

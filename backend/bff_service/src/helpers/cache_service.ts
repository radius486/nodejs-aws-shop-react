import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 120 });

export function getCache(key: string) {
  const cachedData = cache.get(key);

  if (cachedData) {
    return { data: cachedData, fromCache: true };
  }
  return { data: null, fromCache: false };
}

export function setCache(key: string, data: any) {
  cache.set(key, data);
}

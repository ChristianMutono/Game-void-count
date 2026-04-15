// Bridges @void-count/core's synchronous storage interface to RN's
// async-only AsyncStorage. We shadow a synchronous in-memory cache that's
// hydrated on boot, so reads are cheap and writes fan out to both the cache
// and the async persistence layer.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStorage } from '@void-count/core';

const cache = new Map();

export async function hydrateStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) if (v !== null) cache.set(k, v);
  } catch (e) {
    console.warn('[storage] hydrate failed:', e);
  }

  setStorage({
    getItem: (k) => (cache.has(k) ? cache.get(k) : null),
    setItem: (k, v) => {
      const str = String(v);
      cache.set(k, str);
      AsyncStorage.setItem(k, str).catch((e) => console.warn('[storage] setItem:', e));
    },
    removeItem: (k) => {
      cache.delete(k);
      AsyncStorage.removeItem(k).catch((e) => console.warn('[storage] removeItem:', e));
    },
  });
}

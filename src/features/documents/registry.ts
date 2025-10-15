// src/features/documents/registry.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DocKind = 'pdf' | 'csv';
export type RecentDoc = { 
  id: string; 
  kind: DocKind; 
  name: string; 
  uri: string; 
  ts: number 
};

const KEY = 'documents:recent';

export async function addRecent(doc: Omit<RecentDoc, 'ts'>) {
  const rec: RecentDoc = { ...doc, ts: Date.now() };
  const list = await getRecents();
  const dedup = [rec, ...list.filter(x => x.uri !== rec.uri)].slice(0, 20);
  await AsyncStorage.setItem(KEY, JSON.stringify(dedup));
  return dedup;
}

export async function getRecents(): Promise<RecentDoc[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { 
    return JSON.parse(raw) as RecentDoc[]; 
  } catch { 
    return []; 
  }
}

export async function clearRecents() {
  await AsyncStorage.removeItem(KEY);
}

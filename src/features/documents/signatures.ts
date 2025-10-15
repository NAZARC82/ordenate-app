// src/features/documents/signatures.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Signature = { 
  id: string; 
  name: string; 
  dataUri: string; 
  createdAt: number 
};

const KEY = 'documents:signatures';

export async function listSignatures(): Promise<Signature[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { 
    return JSON.parse(raw) as Signature[]; 
  } catch { 
    return []; 
  }
}

export async function saveSignature(sig: Omit<Signature, 'createdAt'>) {
  const list = await listSignatures();
  const item: Signature = { ...sig, createdAt: Date.now() };
  const dedup = [item, ...list.filter(s => s.id !== item.id)];
  await AsyncStorage.setItem(KEY, JSON.stringify(dedup));
  return item;
}

export async function deleteSignature(id: string) {
  const list = await listSignatures();
  const next = list.filter(s => s.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clearSignatures() {
  await AsyncStorage.removeItem(KEY);
}

import { db, getOrCreateAnonUser, doc, setDoc, collection, query, where, orderBy, getDocs, deleteDoc, writeBatch } from './firebase';
import { nanoid } from 'nanoid';

let lastSavedHash = '';
let saveTimeout = null;

function hashContent(original, modified) {
  return `${original.length}:${modified.length}:${original.slice(0, 100)}:${modified.slice(0, 100)}`;
}

/**
 * Save a snapshot (debounced, 5s after last edit, only if content changed).
 */
const MAX_SIZE = 500_000; // 500KB per side

export function saveSnapshot(original, modified) {
  if (!db) return;
  if (original.length > MAX_SIZE || modified.length > MAX_SIZE) return;

  const hash = hashContent(original, modified);
  if (hash === lastSavedHash) return;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    const user = await getOrCreateAnonUser();
    if (!user) return;

    // Check again after debounce
    const currentHash = hashContent(original, modified);
    if (currentHash === lastSavedHash) return;

    try {
      const id = nanoid();
      await setDoc(doc(db, 'history', id), {
        id,
        user_id: user.uid,
        original,
        modified,
        original_lang: null,
        modified_lang: null,
        preview_original: original.slice(0, 100),
        preview_modified: modified.slice(0, 100),
        created_at: new Date().toISOString(),
      });
      lastSavedHash = currentHash;
    } catch (error) {
      console.error('Failed to save snapshot:', error);
    }
  }, 5000);
}

/**
 * Get all history snapshots for the current user, newest first.
 */
export async function getHistory() {
  if (!db) return [];

  const user = await getOrCreateAnonUser();
  if (!user) return [];

  try {
    const q = query(
      collection(db, 'history'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return [];
  }
}

/**
 * Delete a single snapshot.
 */
export async function deleteSnapshot(id) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'history', id));
  } catch (error) {
    console.error('Failed to delete snapshot:', error);
  }
}

/**
 * Clear all history for the current user.
 */
export async function clearHistory() {
  if (!db) return;

  const user = await getOrCreateAnonUser();
  if (!user) return;

  try {
    const q = query(
      collection(db, 'history'),
      where('user_id', '==', user.uid)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

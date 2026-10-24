import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { auth } from '../lib/firebase';

type ClubState = { saved: string[]; toggleSaved: (slug: string) => Promise<void>; ready: boolean; storageError: string; user: User | null; authReady: boolean; reducedMotion: boolean };
const ClubContext = createContext<ClubState | null>(null);
const key = 'abt.saved.v1';
export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const savedRef = useRef<string[]>([]);
  const saving = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key).then(value => {
      const parsed: unknown = value ? JSON.parse(value) : [];
      if (active && Array.isArray(parsed)) {
        savedRef.current = parsed.filter((x): x is string => typeof x === 'string');
        setSaved(savedRef.current);
      }
    }).catch(() => { if (active) setStorageError('Saved moments could not be loaded on this device.'); })
      .finally(() => { if (active) setReady(true); });
    const unsubscribe = onAuthStateChanged(auth, next => { setUser(next); setAuthReady(true); }, () => setAuthReady(true));
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReducedMotion(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { active = false; unsubscribe(); subscription.remove(); };
  }, []);
  async function toggleSaved(slug: string) {
    if (!ready) return;
    const before = savedRef.current;
    const next = before.includes(slug) ? before.filter(x => x !== slug) : [...before, slug];
    savedRef.current = next;
    setSaved(next);
    // Serialize rapid taps so an older write cannot overwrite the latest list.
    saving.current = saving.current.catch(() => {}).then(() => AsyncStorage.setItem(key, JSON.stringify(next)));
    try { await saving.current; setStorageError(''); }
    catch { setStorageError('This device could not save your changes. Please try again.'); }
  }
  return <ClubContext.Provider value={{ saved, toggleSaved, ready, storageError, user, authReady, reducedMotion }}>{children}</ClubContext.Provider>;
}
export function useClub() {
  const context = useContext(ClubContext);
  if (!context) throw new Error('ClubProvider is missing');
  return context;
}

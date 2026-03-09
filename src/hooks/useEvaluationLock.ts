import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, set, get, onValue, remove, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';

const LOCK_PATH = 'App/ActiveEvaluation';
// If a lock hasn't been pinged in 30 seconds, it's considered orphaned and can be overridden.
const LOCK_TIMEOUT_MS = 30000;
const PING_INTERVAL_MS = 10000;

export interface EvaluationLockData {
  profileId: string;
  profileName: string;
  lockedAt: number;
  lastPing: number;
}

export function useEvaluationLock(currentProfileId: string, currentProfileName: string) {
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [amILocked, setAmILocked] = useState(false);
  
  const pingIntervalRef = useRef<number | NodeJS.Timeout | null>(null);

  // Monitor the lock stat
  useEffect(() => {
    const lockRef = ref(database, LOCK_PATH);
    const unsubscribe = onValue(lockRef, (snapshot) => {
      const lockData = snapshot.val() as EvaluationLockData | null;
      
      if (!lockData) {
        setIsLockedByOther(false);
        setActiveName(null);
        if (amILocked) {
          // Somebody else cleared the lock, we shouldn't consider ourselves locked anymore
          setAmILocked(false);
          stopPing();
        }
        return;
      }

      const now = Date.now();
      const isStale = (now - lockData.lastPing) > LOCK_TIMEOUT_MS;

      if (lockData.profileId === currentProfileId) {
        // We hold the lock
        setIsLockedByOther(false);
        setActiveName(lockData.profileName);
        if (!amILocked && !isStale) {
            // We hold the lock but the state doesn't reflect it, so restore it
            setAmILocked(true);
            startPing();
        }
      } else {
        // Someone else holds the lock
        if (isStale) {
          // Orhpaned lock, we consider it free
          setIsLockedByOther(false);
          setActiveName(null);
        } else {
          // Active lock
          setIsLockedByOther(true);
          setActiveName(lockData.profileName);
          if (amILocked) {
              setAmILocked(false);
              stopPing();
          }
        }
      }
    });

    return () => {
      unsubscribe();
      stopPing();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProfileId, amILocked]);

  // Clean up on unmount if we hold the lock
  useEffect(() => {
    return () => {
        if (amILocked) {
            // Need to read fresh reference inside the cleanup, or safely remove directly
            const lockRef = ref(database, LOCK_PATH);
            remove(lockRef);
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current as NodeJS.Timeout);
            }
        }
    };
  }, [amILocked]);

  const startPing = useCallback(() => {
    if (pingIntervalRef.current) return;
    
    pingIntervalRef.current = setInterval(async () => {
      const lockRef = ref(database, LOCK_PATH);
      await set(lockRef, {
        profileId: currentProfileId,
        profileName: currentProfileName,
        lockedAt: serverTimestamp(), // Ideally should keep original lockedAt, but serverTimestamp ensures sync. Simplification: just update lastPing.
        lastPing: serverTimestamp()
      });
    }, PING_INTERVAL_MS);
  }, [currentProfileId, currentProfileName]);

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current as NodeJS.Timeout);
      pingIntervalRef.current = null;
    }
  }, []);

  const acquireLock = async () => {
    const lockRef = ref(database, LOCK_PATH);
    const snapshot = await get(lockRef);
    const lockData = snapshot.val() as EvaluationLockData | null;

    if (lockData && lockData.profileId !== currentProfileId) {
        const now = Date.now();
        const isStale = (now - lockData.lastPing) > LOCK_TIMEOUT_MS;
        if (!isStale) {
            // Actively locked by someone else
            setIsLockedByOther(true);
            setActiveName(lockData.profileName);
            return false;
        }
    }

    // Free or our own lock or orphaned lock, we can acquire
    await set(lockRef, {
      profileId: currentProfileId,
      profileName: currentProfileName,
      lockedAt: serverTimestamp(),
      lastPing: serverTimestamp()
    });

    setAmILocked(true);
    startPing();
    return true;
  };

  const releaseLock = async () => {
    const lockRef = ref(database, LOCK_PATH);
    await remove(lockRef);
    setAmILocked(false);
    stopPing();
  };

  return {
    isLockedByOther,
    activeName,
    amILocked,
    acquireLock,
    releaseLock
  };
}

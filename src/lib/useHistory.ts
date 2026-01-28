
import {useState} from 'react';
import { SearchResponse} from './useNlWeb';
import useSWR, { mutate } from "swr";

// 1. The "Fetcher" - simply reads from Local Storage
const localStorageFetcher = (key:string) => {
  if (typeof window === "undefined") return null;
  const item = localStorage.getItem(key);
  try {
    return item ? JSON.parse(item) : null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export interface QueryResultSet {
  query: string;
  response: SearchResponse;
}

function useStorageSWR<T>(key:string|null, initialValue:T):[T, (data: T) => void] {
  // 2. Use SWR
  // We pass 'fallbackData' to make the initial render synchronous if possible
  const { data, mutate: mutateKey } = useSWR<T>(key, localStorageFetcher, {
    fallbackData:
      typeof window !== "undefined" && key
        ? localStorageFetcher(key) ?? initialValue
        : initialValue,
    revalidateOnFocus: false, // Optional: prevents re-reading storage on window focus
  });

  // 3. Wrapper to update Local Storage and notify SWR
  const setValue = (value:T) => {
    try {
      const valueToStore = value instanceof Function ? value(data) : value;

      // Update Local Storage
      if (typeof window !== "undefined" && key) {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Update SWR Cache (this updates all other components using this key)
      mutateKey(valueToStore, false); 
      
      // Optional: Update global cache if you are using the global 'mutate'
      // mutate(key, valueToStore, false); 
    } catch (error) {
      console.error(error);
    }
  };

  return [data ?? initialValue, setValue];
};

export interface Backend {
  site: string;
  endpoint: string;
}
export interface SearchSession {
  query: string;
  sessionId: string;
  backend:Backend
}
export function useSearchSessions(): {sessions: SearchSession[]; startSession: (sessionId: string, initResult: QueryResultSet, backend: Backend) => void; deleteSession: (sessionId: string) => void} {
  const [sessions, setSessions] = useStorageSWR<SearchSession[]>("/sessions", []);
  function startSession(sessionId: string, initResult: QueryResultSet, backend: Backend) {
    // Save the item to to the session
    localStorage.setItem(`/session/${sessionId}`, JSON.stringify([initResult]));
    setSessions([...sessions, {sessionId: sessionId, query: initResult.query, backend: backend}])
    mutate(`/session/${sessionId}`, [initResult]);
  }
  function deleteSession(sessionId: string) {
    setSessions(sessions.filter(s => s.sessionId != sessionId));
    localStorage.removeItem(`/session/${sessionId}`);
    mutate<QueryResultSet[]>(`/session/${sessionId}`, []);
  }
  console.log(sessions);
  return {
    sessions: sessions,
    startSession: startSession,
    deleteSession: deleteSession
  }
}

export function useSearchSession(sessionId: string | null):[QueryResultSet[], (data: QueryResultSet[]) => void] {
  const [queryResults, setQueryResults] = useStorageSWR<QueryResultSet[]>(sessionId ? `/session/${sessionId}` : null, []);
  return [queryResults, setQueryResults]
}
import { useLiveQuery } from "dexie-react-hooks";
import { db, type QueryResultSet, type Backend, type SearchSession } from './db';
import { NlwebResult } from "./parseSchema";

export type { QueryResultSet, Backend, SearchSession };
export function useSearchSessions(): {sessions: SearchSession[]; startSession: (sessionId: string, query: string, backend: Backend) => Promise<void>; deleteSession: (sessionId: string) => Promise<void>} {
  const sessions = useLiveQuery(() => db.sessions.orderBy('updated').reverse().toArray(), []) ?? [];
  async function startSession(sessionId: string, query: string, backend: Backend) {
    await db.transaction('rw', db.messages, db.sessions, async () => {
      // Find a session with the same query. If one exists, delete it.
      const duplicates = sessions.filter(s => s.query == query);
      for (const s of duplicates) {
        await db.messages.where('sessionId').equals(s.sessionId).delete();
        db.sessions.delete(s.sessionId);
      }
      const created = new Date();
      const updated = new Date();
      await db.sessions.put({sessionId, query, backend, created, updated});
    });
  }

  async function deleteSession(sessionId: string) {
    await db.transaction('rw', db.messages, db.sessions, async () => {
      await db.messages.where('sessionId').equals(sessionId).delete();
      db.sessions.delete(sessionId);
    });
  }

  return {
    sessions: sessions,
    startSession: startSession,
    deleteSession: deleteSession
  }
}


export interface SearchSessionManager {
  searches: QueryResultSet[];
  addSearch: (data: QueryResultSet) => Promise<void>;
  addResults: (id: string, results: NlwebResult[]) => Promise<void>;
}
export function useSearchSession(sessionId: string | null): SearchSessionManager {
  const queryResults = useLiveQuery<QueryResultSet[]>(
    async () => {
      if (!sessionId) return [];
      return await db.messages.where('sessionId').equals(sessionId).sortBy('id')
    },
    [sessionId]
  ) ?? [];

  async function addSearch(result: QueryResultSet) {
    await db.transaction('rw', db.messages, db.sessions, async () => {
        db.sessions.update(result.sessionId, {
          updated: new Date()
        })
        db.messages.add(result);
    })
  }

  async function addResults(id: string, results: NlwebResult[]) {
    await db.transaction('rw', db.messages, db.sessions, async () => {
        const currMessage = await db.messages.get(id);
        if (currMessage) {
          db.sessions.update(currMessage.sessionId, {
            updated: new Date()
          })
          db.messages.update(id, {...currMessage, response: {
            ...currMessage.response, results: [...currMessage.response.results, ...results]
          }}); 
        }
    })
  }

  return {
    searches: queryResults,
    addSearch,
    addResults
  }
}
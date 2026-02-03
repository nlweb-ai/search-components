import { useLiveQuery } from "dexie-react-hooks";
import { db, type QueryResultSet, type Backend, type SearchSession } from './db';

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

export function useSearchSession(sessionId: string | null):[QueryResultSet[], (data: QueryResultSet) => Promise<void>] {
  const queryResults = useLiveQuery<QueryResultSet[]>(
    async () => {
      if (!sessionId) return [];
      return await db.messages.where('sessionId').equals(sessionId).sortBy('id')
    },
    [sessionId]
  ) ?? [];

  async function addResult(result: QueryResultSet) {
    await db.transaction('rw', db.messages, db.sessions, async () => {
        db.sessions.update(result.sessionId, {
          updated: new Date()
        })
        db.messages.add(result);
    })
  }

  return [queryResults, addResult]
}
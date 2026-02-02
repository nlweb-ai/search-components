// db.ts
import { Dexie, type EntityTable } from "dexie"
import { SearchResponse} from './useNlWeb';

interface Friend {
  id: number
  name: string
  age: number
}

interface QueryResultSet {
  id: string;
  sessionId: string;
  query: string;
  response: SearchResponse;
}

interface Backend {
  site: string;
  endpoint: string;
}

interface SearchSession {
  query: string;
  sessionId: string;
  backend:Backend
}


const db = new Dexie("ChatHistory") as Dexie & {
  messages: EntityTable<
    QueryResultSet,
    "id" // primary key "id" (for the typings only)
  >,
  sessions: EntityTable<
    SearchSession,
    "sessionId"
  >
}

// Schema declaration:
db.version(1).stores({
  messages: "++id, sessionId", // primary key "id" (for the runtime!),
  sessions: "sessionId"
})

export type { Friend, QueryResultSet, Backend, SearchSession }
export { db }

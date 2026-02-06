import type { Meta, StoryObj } from '@storybook/react';
import { ChatSearch } from './ChatSearch';
import { HistorySidebar } from './HistorySidebar'
import { DebugTool } from './DebugTools'
import {SiteDropdown, type Site} from "./SiteDropdown"
import {useState} from 'react';
import {SearchSession,
useSearchSessions, useSearchSession, QueryResultSet} from '../lib/useHistory';
import {useNlWeb} from '../lib/useNlWeb';

const SITES:Site[] = [
  {url: 'yoast-site-recipes.azurewebsites.net', featured: true},
  {url: 'yoast-site-rss.azurewebsites.net', featured: true},
  {url: 'imdb.com', featured: true},
  {url: 'aajtak.in'}
]
const PROD_ENDPOINT = "https://internal-testing.nlweb.ai/ask";


/**
 * ChatSearch provides an interactive conversational search experience with AI-powered summaries.
 *
 * The component features:
 * - A search input that opens a full-screen dialog
 * - AI-generated summaries of search results
 * - Visual result cards with thumbnails
 * - Follow-up query support for conversational search
 * - Streaming results as they load
 */
const meta: Meta<typeof ChatSearch> = {
  title: 'Components/ChatSearch',
  component: ChatSearch,

  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta;
type Story = StoryObj<typeof ChatSearch>;

/**
 * Default ChatSearch implementation using the standard endpoint and site.
 *
 * **Usage:**
 * 1. Enter a search query in the input field
 * 2. Press Enter or click the submit button
 * 3. View AI-generated summary and results in the full-screen dialog
 * 4. Ask follow-up questions using the bottom search bar
 */
export const Default: Story = {
  render: (args) => {
    const [searches, setSearches] = useState<QueryResultSet[]>([]);
    const [site, setSite] = useState<Site>(SITES[0]);
    const config = {
      endpoint: PROD_ENDPOINT,
      site: site.url,
      maxResults: 9,
      numRetrievalResults: 50
    }
    const nlweb = useNlWeb(config);
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Recipe Search</h1>
        <ChatSearch
          searches={searches}
          startSession={() => setSearches([])}
          endSession={() => setSearches([])}
          addSearch={r => setSearches(curr => [...curr, r])}
          addResults={async (id, r) => {
            setSearches(curr => curr.map((c, i) => `${i}` == id ? ({...c, response: {...c.response, results: [...c.response.results, ...r]}}) : c))
          }}
          config={config}
          nlweb={nlweb}
        />
        <SiteDropdown 
          sites={SITES} 
          selected={site} 
          onSelect={url => setSite(SITES.find(s => s.url == url) || ({
            url: url || ''
          }))}
        />
      </div>
    )
  }
};



/**
 * ChatSearch with debug tools
 *
 * **Usage:**
 * 1. Enter a search query in the input field
 * 2. Press Enter or click the submit button
 * 3. View AI-generated summary and results in the full-screen dialog
 * 4. Ask follow-up questions using the bottom search bar
 */
export const WithDebugTools: Story = {
  render: (args) => {
    const [searches, setSearches] = useState<QueryResultSet[]>([])
    const [site, setSite] = useState<Site>(SITES[0]);
    const config = {
      endpoint: PROD_ENDPOINT,
      site: site.url,
      maxResults: 9,
      numRetrievalResults: 50
    }
    const nlweb = useNlWeb(config);
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Recipe Search + Debugger</h1>
        <div className='text-sm mb-3 text-gray-500'>
          Use the debugger to see raw backend responses, and data that is dropped.
        </div>
        <ChatSearch
          startSession={() => setSearches([])}
          endSession={() => setSearches([])}
          searches={searches}
          addSearch={r => setSearches(curr => [...curr, {...r, id: `${searches.length}`}])}
          addResults={async (id, r) => {
            setSearches(curr => curr.map((c, i) => `${i}` == id ? ({...c, response: {...c.response, results: [...c.response.results, ...r]}}) : c))
          }}
          config={config}
          nlweb={nlweb}
        >
          <div className='fixed left-4 top-12 z-50'>
            <DebugTool
              streamingState={nlweb}
              searches={searches}
              config={config}
            />
          </div>
        </ChatSearch>
        <SiteDropdown 
          sites={SITES} 
          selected={site} 
          onSelect={url => setSite(SITES.find(s => s.url == url) || ({
            url: url || ''
          }))}
        />
      </div>
    )
  }
};



/**
 * Search History Powered Chat Search
 *
 * **Usage:**
 * 1. Enter a search query in the input field
 * 2. Press Enter or click the submit button
 * 3. View AI-generated summary and results in the full-screen dialog
 * 4. Ask follow-up questions using the bottom search bar
 */
const PAGES = 2;
export const WithSearchHistory: Story = {
  render: (args) => {
    const [site, setSite] = useState<Site>(SITES[0]);
    const nlwebConfig = {
      endpoint: PROD_ENDPOINT,
      site: site.url,
      maxResults: 9,
      numRetrievalResults: 50
    }
    const nlweb = useNlWeb(nlwebConfig);
    const localSessions = useSearchSessions();
    const [sessionId, setSessionId] = useState<string>(crypto.randomUUID());
    const {searches, addSearch, addResults} = useSearchSession(sessionId);
    async function startSearch(query: string) {
      nlweb.clearResults();
      const newId = localSessions.sessions.some(s => s.sessionId === sessionId) ? crypto.randomUUID() : sessionId ;
      await localSessions.startSession(newId, query, {
        site: site.url,
        endpoint: PROD_ENDPOINT
      })
      setSessionId(newId);
      return newId;
    }
    function endSearch() {
      setSessionId(crypto.randomUUID());
      nlweb.clearResults();
      nlweb.cancelSearch();
    }
    function selectSession(session: SearchSession) {
      nlweb.clearResults();
      nlweb.cancelSearch();
      setSessionId(session.sessionId);
      setSite(SITES.find(s => s.url == session.backend.site) || {
        url: session.backend.site
      });
    }
    return (
      <div className="h-screen flex items-stretch">
        <HistorySidebar
          sessions={localSessions.sessions}
          onSelect={selectSession}
          onDelete={localSessions.deleteSession}
          onCreate={endSearch}
        />
        <div className='p-8 flex-1'>
          <div className='max-w-3xl mx-auto'>

            <ChatSearch
              sessionId={sessionId}
              startSession={startSearch}
              endSession={endSearch}
              searches={searches}
              addSearch={addSearch}
              addResults={addResults}
              config={nlwebConfig}
              nlweb={nlweb}
              sidebar={<HistorySidebar
                selected={sessionId}
                sessions={localSessions.sessions}
                onSelect={selectSession}
                onDelete={localSessions.deleteSession}
                onCreate={endSearch}
              />}
            >
        
            </ChatSearch>
            <SiteDropdown 
              sites={SITES} 
              selected={site} 
              onSelect={url => setSite(SITES.find(s => s.url == url) || ({
                url: url || ''
              }))}
            />
          </div>
        </div>
      </div>
    )
  }
} satisfies Story;


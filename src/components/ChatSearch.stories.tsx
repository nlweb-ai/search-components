import type { Meta, StoryObj } from '@storybook/react';
import { ChatSearch } from './ChatSearch';
import { HistorySidebar } from './HistorySidebar'
import {useState} from 'react';
import {useSearchSessions, useSearchSession, QueryResultSet} from '../lib/useHistory';

const NEW_ENDPOINT_WITH_60_SITES = "https://fwbrdyftb6bvdvgs.fz47.alb.azure.com/ask"
const OLD_ENDPOINT = "https://fmfpc5c0aydvf2ft.fz93.alb.azure.com/ask"


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
  argTypes: {
    endpoint: {
      control: 'select',
      description: 'The API endpoint URL for the NLWeb search service. This endpoint handles search queries and returns AI-generated summaries with results.',
      options: [
        OLD_ENDPOINT,
        NEW_ENDPOINT_WITH_60_SITES,
      ],
    },
    site: {
      control: 'select',
      description: 'The target site domain to search within. The search will be scoped to content from this specific site.',
      options: [
        'yoast-site-recipes.azurewebsites.net',
        'yoast-site-rss.azurewebsites.net',
        'ambitiouskitchen.com',
      ],
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'yoast-site-recipes.azurewebsites.net' },
      },
    },
  },
};

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
  args: {
    endpoint: OLD_ENDPOINT,
    site: 'yoast-site-recipes.azurewebsites.net',
  },
  render: (args) => {
    const [results, setResults] = useState<QueryResultSet[]>([])
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">NLWeb Chat Search Playground</h1>
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Using:</span>
            <span className="px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-full text-purple-700 font-medium">
              {args.endpoint == OLD_ENDPOINT ? 'Dev NLWeb' : 'Prod NLWeb'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Searching:</span>
            <span className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 font-medium">
              {args.site}
            </span>
          </div>
        </div>
        <ChatSearch 
          results={results} 
          setResults={setResults} 
          site={args.site}
          endpoint={args.endpoint}
        />
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This example is driven by the endpoint and site parameters,
            available in the controls section.
          </p>
        </div>
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
  args: {
    endpoint: OLD_ENDPOINT,
    site: 'yoast-site-recipes.azurewebsites.net',
  },
  render: (args) => {
    const [results, setResults] = useState<QueryResultSet[]>([])
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">NLWeb Debugger</h1>
        <div className='text-sm mb-3 text-gray-500'>
          Use the debugger to see raw backend responses, and data that is dropped.
        </div>
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Using:</span>
            <span className="px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-full text-purple-700 font-medium">
              {args.endpoint == OLD_ENDPOINT ? 'Dev NLWeb' : 'Prod NLWeb'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Searching:</span>
            <span className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 font-medium">
              {args.site}
            </span>
          </div>
        </div>
        <ChatSearch 
          results={results} 
          setResults={setResults} 
          site={args.site}
          endpoint={args.endpoint}
          debug={true}
        />
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This example is driven by the endpoint and site parameters,
            available in the controls section.
          </p>
        </div>
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
export const WithSearchHistory: Story = {
  args: {
    endpoint: OLD_ENDPOINT,
    site: 'yoast-site-recipes.azurewebsites.net',
    debug: true,
  },
  render: (args) => {
    const localSessions = useSearchSessions();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionResults, setSessionResults] = useSearchSession(sessionId);
    function startSearch(firstResult: QueryResultSet) {
      const sessionId = crypto.randomUUID();
      localSessions.startSession(sessionId, firstResult, {
        site: args.site,
        endpoint: args.endpoint
      })
      setSessionId(sessionId);
    }
    function endSearch() {
      setSessionId(null);
    }
    return (
      <div className="flex items-stretch h-full">
        <HistorySidebar 
          sessions={localSessions.sessions}
          onSelect={(session) => setSessionId(session.sessionId)}
          onDelete={localSessions.deleteSession}
        />
        <div className='p-8 flex-1'>
          <div className='max-w-3xl mx-auto'>
            <ChatSearch 
              key={sessionId}
              startSession={startSearch}
              endSession={endSearch}
              results={sessionResults} 
              setResults={setSessionResults} 
              site={args.site}
              endpoint={args.endpoint}
              debug={args.debug}
            />
            <div className="mb-6 flex gap-3 items-center">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Using:</span>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-full text-purple-700 font-medium">
                  {args.endpoint == OLD_ENDPOINT ? 'Dev NLWeb' : 'Prod NLWeb'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Searching:</span>
                <span className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 font-medium">
                  {args.site}
                </span>
              </div>
            </div>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This example is driven by the endpoint and site parameters,
                available in the controls section.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
};


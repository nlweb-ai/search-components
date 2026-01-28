
import {QueryResultSet} from '../lib/useHistory'
import {BugAntIcon, XMarkIcon, MagnifyingGlassIcon} from '@heroicons/react/24/solid'
import {useEffect,
useState} from 'react';
import {Dialog, DialogPanel, DialogTitle, Button, Tab, TabGroup, TabList, TabPanel, TabPanels} from '@headlessui/react';
import {clsx} from 'clsx';
import { NLWebSearchParams, NLWebSearchState, V054Request, convertParamsToRequest } from '../lib/useNlWeb';


interface TextPart {
  type: 'text';
  text: string;
}

interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: unknown;
}

interface ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  output: {
    type: 'json';
    value: unknown;
  };
}

type ChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | Array<TextPart | ToolCallPart> }
  | { role: 'tool'; content: Array<ToolResultPart> };


function translateResultsToChatMessages(loadingQuery: string | null, streamingState: NLWebSearchState, results: QueryResultSet[]): ChatMessage[] {
  const messages: ChatMessage[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const toolCallId = `nlweb-${i}-${Date.now()}`;

    // 1. Add user message with the query
    messages.push({
      role: 'user',
      content: result.query
    });

    // 2. Add assistant message with tool call to nlweb
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: toolCallId,
          toolName: 'nlweb',
          args: {
            query: result.query,
            conversationHistory: results.slice(0, i).map(r => r.query)
          }
        }
      ]
    });

    // 3. Add tool message with the search results
    messages.push({
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: toolCallId,
          toolName: 'nlweb',
          output: {
            type: 'json',
            value: {
              structuredResults: result.response.results,
            }
          }
        }
      ]
    });

    // 4. Add assistant message with decontextualized query and summary as text parts
    const assistantContent: Array<TextPart> = [];

    if (result.response.decontextualizedQuery) {
      assistantContent.push({
        type: 'text',
        text: `Decontextualized Query: ${result.response.decontextualizedQuery}`
      });
    }

    if (result.response.summary) {
      assistantContent.push({
        type: 'text',
        text: result.response.summary
      });
    }

    messages.push({
      role: 'assistant',
      content: assistantContent.length > 0 ? assistantContent : 'No summary available'
    });
  }

  // Handle loading query and streaming state
  if (loadingQuery && streamingState.isLoading) {
    const streamingToolCallId = `nlweb-streaming-${Date.now()}`;

    // 1. Add user message with the loading query
    messages.push({
      role: 'user',
      content: loadingQuery
    });

    // 2. Add assistant message with tool call
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: streamingToolCallId,
          toolName: 'nlweb',
          args: {
            query: loadingQuery,
            conversationHistory: results.map(r => r.query)
          }
        }
      ]
    });

    // 3. If there are streaming results, add tool message
    if (streamingState.results && streamingState.results.length > 0) {
      messages.push({
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: streamingToolCallId,
            toolName: 'nlweb',
            output: {
              type: 'json',
              value: {
                structuredResults: streamingState.results,
              }
            }
          }
        ]
      });

      // 4. Add assistant message with streaming summary/decontextualized query
      const streamingAssistantContent: Array<TextPart> = [];

      if (streamingState.decontextualizedQuery) {
        streamingAssistantContent.push({
          type: 'text',
          text: `Decontextualized Query: ${streamingState.decontextualizedQuery}`
        });
      }

      if (streamingState.summary) {
        streamingAssistantContent.push({
          type: 'text',
          text: streamingState.summary
        });
      }

      if (streamingAssistantContent.length > 0) {
        messages.push({
          role: 'assistant',
          content: streamingAssistantContent
        });
      }
    }
  }

  return messages;
}


interface NlWebTurn {
  request: V054Request;
  response: object[]
}

function translateResultsToNlWebRequests(
  loadingQuery: string | null,
  streamingState: NLWebSearchState,
  results: QueryResultSet[],
  site: string,
  maxResults: number = 50
): NlWebTurn[] {
  const turns: NlWebTurn[] = [];

  // Process completed results
  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    // Build the search params
    const params: NLWebSearchParams = {
      query: result.query,
      conversationHistory: i > 0 ? results.slice(0, i).map(r => r.query) : undefined,
    };

    // Convert to V054Request using the utility function
    const request = convertParamsToRequest(params, site, maxResults);

    // Create the turn with the request and raw logs as response
    turns.push({
      request: request,
      response: result.response.rawLogs || []
    });
  }

  // Handle loading query and streaming state
  if (loadingQuery && streamingState.isLoading) {
    // Build the search params for the loading query
    const streamingParams: NLWebSearchParams = {
      query: loadingQuery,
      conversationHistory: results.length > 0 ? results.map(r => r.query) : undefined,
    };

    // Convert to V054Request
    const streamingRequest = convertParamsToRequest(streamingParams, site, maxResults);

    // Create the turn with the request and streaming raw logs as response
    turns.push({
      request: streamingRequest,
      response: streamingState.rawLogs || []
    });
  }

  return turns;
}


function CodeBlock({code} : {code: string}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <Button
        onClick={handleCopy}
        className="absolute top-0 right-0 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </Button>
      <pre className="overflow-auto text-gray-500 text-sm pr-20">
        {code}
      </pre>
    </div>
  )
}

function MessagesDialog({
  isOpen,
  onClose,
  results,
  site,
  maxResults,
  loadingQuery,
  streamingState,

}: {
  isOpen: boolean;
  onClose: () => void;
  results: QueryResultSet[];
  streamingState: NLWebSearchState;
  site: string;
  loadingQuery: string | null;
  maxResults: number;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex flex-col bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Content with Tabs */}
          <TabGroup className={'flex flex-col flex-1 overflow-hidden'}>
            <TabList className="flex border-b bg-gray-50">
              <Tab
                className={({selected}) =>
                  clsx(
                    'px-6 py-3 text-sm font-medium outline-none transition-colors',
                    selected
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  )
                }
              >
                Parsed Messages
              </Tab>
              <Tab
                className={({selected}) =>
                  clsx(
                    'px-6 py-3 text-sm font-medium outline-none transition-colors',
                    selected
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  )
                }
              >
                Raw Messages
              </Tab>
            </TabList>

            <TabPanels className="flex-1 overflow-y-auto">
              <TabPanel className="p-6">
                <CodeBlock code={JSON.stringify(translateResultsToChatMessages(loadingQuery, streamingState, results), null, 2)}/>
              </TabPanel>

              <TabPanel className="p-6">
                <CodeBlock code={JSON.stringify(translateResultsToNlWebRequests(loadingQuery, streamingState, results, site, maxResults), null, 2)}/>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function DebugToolbar({results, loadingQuery, streamingState, site, maxResults} : {results: QueryResultSet[]; loadingQuery: string | null; streamingState: NLWebSearchState; site: string; maxResults: number}) {
  const [messagesOpen, setMessagesOpen] = useState(false);
  console.log(messagesOpen);
  useEffect(() => {
    console.log('moujnted')
  }, [])
  return (
    <>
      <div className='max-w-5xl flex gap-3 mx-auto p-2 items-center pr-2 px-4 text-sm bg-white border rounded-xl'>
        <BugAntIcon className='size-4 text-gray-500'/>
        <div className='text-gray-500 text-sm'>
          Debugger
        </div>
        <Button
          onClick={() => setMessagesOpen(true)}
          className='ml-auto text-gray-600 hover:bg-gray-100 p-3 py-2 rounded-md text-sm'
        >
          View Messages
        </Button>
      </div>
      <MessagesDialog
        isOpen={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        results={results}
        streamingState={streamingState}
        site={site}
        maxResults={maxResults}
        loadingQuery={loadingQuery}
      />
    </>
  )
}
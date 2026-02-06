
import {QueryResultSet} from '../lib/useHistory'
import {BugAntIcon} from '@heroicons/react/24/solid'
import {useState} from 'react';
import {Dialog, DialogPanel, Button, Tab, TabGroup, TabList, TabPanel, TabPanels} from '@headlessui/react';
import {clsx} from 'clsx';
import { NLWebSearchParams, NLWebSearchState, UseNlWebConfig, V054Request, convertParamsToRequest } from '../lib/useNlWeb';


interface NlWebTurn {
  request: V054Request;
  response: object[]
}

function translateResultsToNlWebRequests(
  streamingState: NLWebSearchState,
  results: QueryResultSet[],
  config: UseNlWebConfig
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
    const request = convertParamsToRequest(params, config.site, config.numRetrievalResults,  config.maxResults);

    // Create the turn with the request and raw logs as response
    turns.push({
      request: request,
      response: result.response.rawLogs || []
    });
  }

  // Handle loading query and streaming state
  if (streamingState.query) {
    // Build the search params for the loading query
    const streamingParams: NLWebSearchParams = {
      query: streamingState.query,
      conversationHistory: results.length > 0 ? results.map(r => r.query) : undefined,
    };

    // Convert to V054Request
    const streamingRequest = convertParamsToRequest(streamingParams, config.site, config.numRetrievalResults, config.maxResults);

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
  searches,
  streamingState,
  config,
}: {
  isOpen: boolean;
  onClose: () => void;
  searches: QueryResultSet[];
  streamingState: NLWebSearchState;
  config: UseNlWebConfig;
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
                Raw Messages
              </Tab>
            </TabList>

            <TabPanels className="flex-1 overflow-y-auto">
              <TabPanel className="p-6">
                <CodeBlock code={JSON.stringify(translateResultsToNlWebRequests(streamingState, searches, config), null, 2)}/>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function DebugTool({searches, streamingState, config} : {searches: QueryResultSet[]; streamingState: NLWebSearchState; config: UseNlWebConfig}) {
  const [messagesOpen, setMessagesOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setMessagesOpen(true)}
        className='flex bg-white items-center gap-2 ml-auto text-gray-600 hover:bg-gray-100 p-3 py-2 rounded-md text-sm'
      >
        <BugAntIcon className='size-4 text-gray-500'/>
        JSON
      </Button>
      <MessagesDialog
        isOpen={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        searches={searches}
        streamingState={streamingState}
        config={config}
      />
    </>
  )
}
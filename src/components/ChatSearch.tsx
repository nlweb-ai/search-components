import { ReactNode, useState, useRef, ImgHTMLAttributes } from 'react';
import { NLWeb, SearchResponse} from '../lib/useNlWeb';
import { Dialog, DialogPanel, Button } from '@headlessui/react'
import { MagnifyingGlassIcon, ArrowRightIcon,XMarkIcon, NewspaperIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx';
import { getThumbnailCandidates, isMovieResult, NlwebResult } from '../lib/parseSchema';
import { shortQuantity, intersperse } from '../lib/util';
import {QueryResultSet} from '../lib/useHistory';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function SearchQuery({initQuery, className, loading, handleSearch, placeholder="Ask anything..."} : {initQuery?: string | null; className?: string; placeholder?: string; loading: boolean; handleSearch: (query: string) => Promise<void>}) {
  const [query, setQuery] = useState(initQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      await handleSearch(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={clsx(`flex relative items-center gap-3 rounded-lg border transition-all duration-200`,
          isFocused
            ? 'border-gray-400 shadow-md ring-2 ring-gray-100'
            : 'border-gray-200 hover:border-gray-300',
          className || 'bg-white'
        )}
      >
        <div className='absolute left-3'>
          <MagnifyingGlassIcon className='size-4 text-gray-400'/>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1! rounded-md! text-base! px-4! pl-10! py-3! text-gray-900 placeholder-gray-400 outline-none bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          disabled={!query.trim() || loading}
          className={`p-2 absolute right-2 rounded-md transition-all duration-200 ${
            query.trim() && !loading
              ? 'bg-black text-white hover:bg-gray-800 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Submit search"
        >
          {loading ? (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <ArrowRightIcon className='size-4'/>
          )}
        </Button>
      </div>
    </form>
  );
}

function ResultCardSkeleton() {
  return (
    <div className="block w-full transition-all duration-200 overflow-hidden animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="h-36 w-full bg-gray-200 rounded"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultCard({result} : {result: NlwebResult}) {
  const srcs = getThumbnailCandidates(result)

  return (
    <a
      href={(result.url || result.grounding || '#') as string}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline! transition-all duration-200 overflow-hidden"
    >
      <div className="flex flex-col gap-3">
        <Thumbnail
          srcs={srcs}
          alt={decodeHtmlEntities((result.name || result.title || 'Result image') as string)}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
            {decodeHtmlEntities((result.name || result.title || 'Untitled') as string)}
          </h3>
          <ResultCardDetails result={result} />
          {result.description && (
            <p className="text-xs text-gray-600 line-clamp-3 mb-2">
              {typeof result.description == "string" ? decodeHtmlEntities(result.description) : ""}
            </p>
          )}
          {result.site && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>{result.site}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

/**
 * `@type`-specific details for rendering inside a result card.
 */
function ResultCardDetails({ result }: { result: NlwebResult }) {
  if (isMovieResult(result)) {
    return (
      <>
        {result.director && (
          <div className="text-xs text-gray-500 font-semibold">
            {Array.isArray(result.director) ? result.director.map(d => d.name).join(', ') : result.director.name}
          </div>
        )}
        <div className="flex items-center gap-1">
          {intersperse([
            result.aggregateRating?.ratingValue ?
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-xs">{
                  typeof result.aggregateRating.ratingValue === 'number' ?
                    result.aggregateRating.ratingValue.toFixed(1) :
                    result.aggregateRating.ratingValue
                }</span>
              </span> :
              null,
            result.aggregateRating?.ratingCount ?
              <span className="text-xs text-gray-500">
                {shortQuantity(result.aggregateRating.ratingCount)} review{result.aggregateRating.ratingCount != 1 ? 's' : ''}
              </span> :
              null,
          ].filter(Boolean), <span className="text-xs text-gray-400">|</span>)}
        </div>
      </>
    )
  }

  return null;
}

function Thumbnail({ srcs, className, ...rest }: { srcs: string[]; } & ImgHTMLAttributes<HTMLImageElement>) {
  // We allow `hasError` to advance this until we exhaust all srcs, at which point
  // we render the placeholder icon.
  const [srcIndex, setSrcIndex] = useState(0);
  
  function advance() {
    setSrcIndex((srcIndex) => {
      const nextIndex = srcIndex + 1;
      return Math.min(nextIndex, srcs.length);
    });
  }

  const srcsExhausted = srcIndex >= srcs.length;
  return (
    <div
      className={clsx(
        "relative text-xs flex-shrink-0 h-36 rounded",
        srcsExhausted && 'bg-gray-100 flex items-center justify-center',
        className,
      )}
    >
      {srcsExhausted ? (
        <NewspaperIcon className='absolute size-5 text-gray-400'/>
      ) : (
        null
      )}
      <img
        src={srcs[srcIndex]}
        className={clsx(
          "w-full h-full object-cover rounded",
          srcsExhausted && 'invisible',
        )}
        {...rest}
        onError={advance}
      />
    </div>
  );
}

function SummaryCard({summary} : {summary? : string | null}) {
  if (summary) {
    return (
      <div className="text-lg text-gray-800 leading-relaxed">
        {summary}
      </div>
    )
  }

  // Skeleton loader with pulsing animation
  return (
    <div className="space-y-3 w-full min-w-md animate-pulse">
      <div className="h-4 bg-gray-200 rounded-md w-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-11/12"></div>
      <div className="h-4 bg-gray-200 rounded-md w-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-10/12"></div>
      <div className="h-4 bg-gray-200 rounded-md w-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-9/12"></div>
    </div>
  )
}
function SimpleSkeleton() {
  return (
    <div className="h-2 bg-gray-100 w-full animate-pulse rounded-md max-w-48"></div>
  )
}

function SearchingFor({query, streaming} : {query?: string | null; streaming?: boolean}) {
  return (
    <div className='text-gray-500 gap-1 flex items-center text-sm pb-2 px-2'>
      {streaming ? "Searching:" : "Searched:"} {query ? <span className='text-gray-800 overflow-ellipse'>{query}</span> : <SimpleSkeleton/>}
    </div>
  )
}

function AssistantMessage({summary, results, loading} : {summary?: string | null; results: NlwebResult[]; loading?: boolean}) {
  const skeletonCount = Math.max(0, 6 - results.length);

  return (
    <div className="flex justify-start mb-6">
      <div className='bg-gray-50 p-6 rounded-lg w-full'>
        <div className="max-w-3xl w-full">
          <div className="space-y-4">
            <SummaryCard summary={summary}/>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
              {results.map((r, idx) =>
                <ResultCard result={r} key={(r.url || r.name || idx) as string}/>
              )}
              {loading && Array.from({ length: skeletonCount }).map((_, idx) =>
                 <ResultCardSkeleton key={`skeleton-${idx}`}/>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QueryMessage({query} : {query: string}) {
  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-2xl">
        <div className="bg-gray-900 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{query}</p>
        </div>
      </div>
    </div>
  )
}

function ChatResults({loadingQuery, streamingModifiedQuery, streamingSummary, streamingResults, results} : {loadingQuery: string | null; streamingModifiedQuery: string | null; streamingSummary?: string | null; streamingResults: NlwebResult[]; results: QueryResultSet[]}) {
  return (
    <div className="space-y-4 py-6">
      {results.map((r, idx) =>
        <div key={`${r.query}-${idx}`}>
          {idx > 0 ? <QueryMessage query={r.query}/> : null}
          {idx > 0 ? <SearchingFor query={r.response.decontextualizedQuery}/> : null}
          {r.response.results.length > 0 ?
            <AssistantMessage 
              summary={r.response.summary} 
              results={r.response.results}
            /> : 
            <div className='flex max-w-2xl text-base justify-start mb-6 bg-gray-50 p-6 rounded-lg'>
              No results found
            </div>
          }
        </div>
      )}
      {loadingQuery && (
        <div>
          {results.length > 0 ? <QueryMessage query={loadingQuery}/> : null}
          {results.length > 0 ? <SearchingFor streaming={true} query={streamingModifiedQuery}/> : null}
          <AssistantMessage
            summary={streamingSummary}
            results={streamingResults}
            loading={true}
          />
        </div>
      )}
    </div>
  )
}

export function ChatSearch({
  results, setResults, startSession, endSession,
  nlweb, children, sidebar,
} : {
  results: QueryResultSet[], 
  setResults: (r: QueryResultSet[], sessionId?: string) => void; 
  startSession?: (query: string) => string;
  endSession?: () => void;
  nlweb: NLWeb; children?: ReactNode
  sidebar?: ReactNode
}) {
  const [searchOpen, setSearchOpen] = useState(results.length > 0);
  function closeSearch() {
    setSearchOpen(false);
    if (endSession) {
      endSession();
    }
  }
  async function handleSearch(query: string, isRoot: boolean) {
    let response: SearchResponse;
    let sessionId:string|null = null;
    if (isRoot) {
      if (startSession) {
        sessionId = startSession(query);
      }
      setSearchOpen(true);
      response = await nlweb.search({
        query: query
      })
    } else {
      response = await nlweb.search({
        query: query,
        conversationHistory: results.map(r => r.query)
      })
    }
    // Remove the from result stream
    nlweb.clearResults();
    // Add to store, in the correct way
    if (isRoot) {
      const initResults = [{query: query, response: response}];
      if (sessionId) {
        setResults(initResults, sessionId);
      } else {
        setResults(initResults);
      }
    } else {
      setResults([...results, {query: query, response: response}])
    }
  }
  const rootQuery = results.length > 0 ? results[0].query : nlweb.loadingQuery;
  const isLoading = !!nlweb.loadingQuery;
  return (
    <div>
      <div className="mb-6">
        <SearchQuery loading={!!nlweb.loadingQuery} handleSearch={(q) => handleSearch(q, true)}/>
      </div>
      <Dialog className={'relative z-50'} open={searchOpen} onClose={closeSearch}>
        <div className="fixed bg-white inset-0 w-screen h-screen overflow-hidden">
          <Button onClick={closeSearch} className='z-50 text-gray-500 hover:text-black absolute right-6 top-4'>
            <XMarkIcon className='size-5'/>
          </Button>
          <DialogPanel className={'w-full h-screen flex items-stretch overflow-hidden'}>
            {sidebar}
            <div className='flex-1 flex flex-col overflow-hidden'>
              {children}
              <div className='relative flex-1 overflow-hidden flex flex-col'>
                <div className='flex-1 overflow-y-auto p-4 pt-16 pb-24'>
                  <div className='max-w-7xl mx-auto'>
                    <div className="mb-6 max-w-xl mx-auto">
                      <SearchQuery 
                        key={rootQuery || 'empty-search'}
                        className='bg-gray-50' 
                        loading={isLoading} 
                        handleSearch={(q) => handleSearch(q, true)}
                        initQuery={rootQuery}
                      />
                    </div>
                    <ChatResults
                      loadingQuery={nlweb.loadingQuery}
                      streamingResults={nlweb.results}
                      streamingSummary={nlweb.summary || null}
                      streamingModifiedQuery={nlweb.decontextualizedQuery || null}
                      results={results}
                    />
                  </div>
                </div>
                <div className='absolute pointer-events-none bottom-0 top-[calc(100%_-_100px)] bg-gradient-to-b from-transparent to-white left-0 right-0'/>
                <div className="absolute bottom-8 left-4 right-4">
                  <div className='max-w-xl mx-auto'>
                    <SearchQuery 
                      key={nlweb.loadingQuery}
                      loading={isLoading} 
                      handleSearch={(q) => handleSearch(q, false)}
                      className='shadow-xl bg-white'
                      placeholder="Enter a follow up query"
                    />
                  </div>
                </div> 
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
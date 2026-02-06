import { RefObject, ReactNode, useEffect, useState, ImgHTMLAttributes } from 'react';
import { NLWeb, useNlWeb, UseNlWebConfig, NLWebSearchState, SearchResponse} from '../lib/useNlWeb';
import { Dialog, DialogPanel, Button } from '@headlessui/react'
import { XMarkIcon, NewspaperIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx';
import { getThumbnailCandidates, isMovieResult, NlwebResult } from '../lib/parseSchema';
import { shortQuantity, intersperse } from '../lib/util';
import {QueryResultSet} from '../lib/useHistory';
import {SearchQuery} from './SearchQuery';
import {useAutoScroll} from '../lib/useAutoScroll';

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

function ResultCardSkeleton() {
  return (
    <div className="block w-full transition-all overflow-hidden shimmer-container">
      <div className="flex flex-col gap-3">
        <div className="h-36 w-full shimmer shimmer-bg shimmer-color-gray-300/30 [--shimmer-x:60] [--shimmer-y:0] bg-gray-100 rounded"></div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4  bg-gray-100 rounded w-3/4"></div>
          <div className="space-y-1">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
          </div>
          <div className="h-2  bg-gray-100 rounded w-1/6"></div>
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
              <span className='truncate'>{result.site}</span>
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
          "w-full! h-full! object-cover! rounded!",
          srcsExhausted && 'invisible',
        )}
        {...rest}
        onError={advance}
      />
    </div>
  );
}

function SummarySkeleton() {
  return (
     <div className="space-y-3 w-full md:min-w-md shimmer-container">
      <div className="h-4 shimmer shimmer-bg shimmer-color-gray-400/20 [--shimmer-x:60] [--shimmer-y:0] bg-gray-200 rounded-md w-full"></div>
      <div className="h-4 shimmer shimmer-bg shimmer-color-gray-400/20 [--shimmer-x:60] [--shimmer-y:20] bg-gray-200 rounded-md w-11/12"></div>
      <div className="h-4 shimmer shimmer-bg shimmer-color-gray-400/20 [--shimmer-x:60] [--shimmer-y:40] bg-gray-200 rounded-md w-full"></div>
      <div className="h-4 shimmer shimmer-bg shimmer-color-gray-400/20 [--shimmer-x:60] [--shimmer-y:60] bg-gray-200 rounded-md w-10/12"></div>
      <div className="h-4 shimmer shimmer-bg shimmer-color-gray-400/20 [--shimmer-x:60] [--shimmer-y:80] bg-gray-200 rounded-md w-full"></div>
    </div>
  )
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
    <SummarySkeleton/>
  )
}

function SearchingFor({query, streaming} : {query?: string | null; streaming?: boolean}) {
  return (
    <div className={clsx('text-gray-500 gap-1 flex items-center text-sm pb-2 px-2', streaming && 'shimmer')}>
      {query ? (
        <span
          key={query}
          className='text-gray-800 overflow-ellipse'
        >
          Searching for: {query}
        </span>
      ) : (
        "Working on it"
      )}
    </div>
  )
}


function PageButton({page, onClick, activePage, disabled=true} : {page: number; activePage: number; onClick: () => void; disabled?: boolean}) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className={clsx("text-sm p-2 size-6 rounded-md transition-colors duration-200 hover:bg-gray-100 flex items-center justify-center", 
        page == activePage ? 'text-gray-700' : 'text-gray-400',
        disabled ? 'opacity-50 pointer-events-none' : ''
      )}
    >
      {page + 1}
    </Button>
  )
}



function AssistantMessage({summary, results, loading, addResults, followUpQuery, config, anchorRef} : {summary?: string | null; results: NlwebResult[]; addResults: (results: NlwebResult[]) => Promise<void>; followUpQuery: string; config: UseNlWebConfig;  loading?: boolean; anchorRef?: RefObject<HTMLDivElement>}) {
   // Create a local nlweb instance, to power pagination. 
  const nlweb = useNlWeb(config);
  // We dont want decontextualization to happen.
  const maxResults = config.maxResults || 50;
  const numRetrievalResults = config.numRetrievalResults || 50;
  const pagesAvailable = Math.floor(numRetrievalResults / maxResults);
  const [page, setPage] = useState(0);
  const pageRange: number[] = Array.from({ length: pagesAvailable + 1 }, (_, index) => index);
  async function viewMoreResults(pageNumber: number) {
    setPage(pageNumber);
    const offsetToFetch = pageNumber * maxResults;
    if (results.length <= (offsetToFetch)) {
      // Here, we explicitly set convo history to none so that we dont 
      // decontexttualize the query again. 
      const response = await nlweb.search({
        query: followUpQuery,
        conversationHistory: [],
        resultOffset: offsetToFetch
      });
      await addResults(response.results);
    }
  }
  const pageOffset = page * maxResults;
  const isStreamingPage = pageOffset == nlweb.resultOffset ;
  const resultsOfPage = isStreamingPage ? nlweb.results : results.slice(pageOffset, (page + 1) * maxResults)
  const skeletonCount = Math.max(0, 9 - resultsOfPage.length);
  return (
    <div className="flex justify-start">
      <div className="max-w-3xl flex-1 bg-gray-50 p-6 rounded-lg">
        <div className="space-y-4 mb-2">
          <SummaryCard summary={summary}/>
          <div ref={anchorRef}/>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'>
            {resultsOfPage.map((r, idx) =>
              <ResultCard result={r} key={(r.url || r.name || idx) as string}/>
            )}
            {(loading || (nlweb.loading && isStreamingPage)) && Array.from({ length: skeletonCount }).map((_, idx) =>
                <ResultCardSkeleton key={`skeleton-${idx}`}/>
            )}
          </div>
        </div>
        <div className='flex mt-4 -mx-2 items-center gap-2'>
          {pageRange.map(p => 
            results.length >= p * maxResults &&
            (p + 1) * maxResults < numRetrievalResults &&
            <PageButton
              onClick={() => viewMoreResults(p)}
              page={p}
              activePage={page}
              key={p}
              disabled={loading}
            />
          )}
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
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {query}
          </p>
        </div>
      </div>
    </div>
  )
}


function ChatEntry({index, query, loading, decontextualizedQuery, summary, results, config, addResults, anchorRef} : {
  index: number; query: string; loading: boolean; decontextualizedQuery?: string | null; summary?: string | null; results: NlwebResult[]; config: UseNlWebConfig; addResults: (results: NlwebResult[]) => Promise<void>; anchorRef?: RefObject<HTMLDivElement>;
}) {
  return (
     <div key={`${query}-${index}`}>
      {index > 0 ? <QueryMessage query={query}/> : null}
      {index > 0 ? <SearchingFor streaming={loading} query={decontextualizedQuery}/> : null}
      {(results.length > 0 || loading) ?
        <AssistantMessage
          anchorRef={anchorRef}
          summary={summary}
          results={results}
          loading={loading}
          followUpQuery={decontextualizedQuery || query}
          addResults={addResults}
          config={config}
        /> :
        <div className='flex max-w-3xl text-base text-gray-500 justify-start bg-gray-50 p-6 rounded-lg'>
          No results found
        </div>
      }
    </div>
  )
}

function ChatResults(
  {nlweb, config, searches, addResults, anchorRef} :
  {nlweb: NLWebSearchState; config: UseNlWebConfig; searches: QueryResultSet[]; addResults: (id: string, results: NlwebResult[]) => Promise<void>;
 anchorRef:  RefObject<HTMLDivElement>;}
) {
  const combinedStreamedResults = searches.length - 1 == nlweb.streamingIndex && searches[nlweb.streamingIndex]?.response ?
    [...nlweb.results, ...searches[nlweb.streamingIndex].response.results.slice(nlweb.results.length)] :
    nlweb.results;
  return (
    <div className="space-y-4 py-6">
      {searches.map((r, idx) =>
        idx != nlweb.streamingIndex && 
          <ChatEntry
            key={`${r.query}-${idx}`}
            loading={false}
            index={idx}
            query={r.query}
            results={r.response.results}
            summary={r.response.summary}
            decontextualizedQuery={r.response.decontextualizedQuery}
            config={config}
            addResults={(results) => addResults(r.id || '', results)}
          />
      )}
      {nlweb.query && (
        <ChatEntry
          key={`${nlweb.query}-${nlweb.streamingIndex}`}
          index={nlweb.streamingIndex}
          query={nlweb.query}
          results={combinedStreamedResults}
          summary={nlweb.summary}
          decontextualizedQuery={nlweb.decontextualizedQuery}
          loading={nlweb.loading}
          anchorRef={anchorRef}
          config={config}
          addResults={(r) => addResults(searches[nlweb.streamingIndex].id || '', r)}
        />
      )}
    </div>
  )
}


export function ChatSearch({
  searches, addSearch, addResults, startSession, endSession,
  nlweb, config, children, sidebar, sessionId= "NLWEB_DEFAULT_SESSION",
} : {
  sessionId?: string
  searches: QueryResultSet[],
  addSearch: (r: QueryResultSet) => Promise<void> | void;
  addResults: (id: string, results: NlwebResult[]) => Promise<void>;
  startSession: (query: string) => Promise<string> | void;
  endSession: () => void;
  nlweb: NLWeb; 
  config: UseNlWebConfig;
  children?: ReactNode
  sidebar?: ReactNode;
}) {
  const { anchorRef } = useAutoScroll<HTMLDivElement>([nlweb.query])
  const [searchOpen, setSearchOpen] = useState(searches.length > 0);
  function closeSearch() {
    setSearchOpen(false);
    if (endSession) {
      endSession();
    }
  }
  async function handleSearch(query: string, isRoot: boolean) {
    let response: SearchResponse;
    let sId:string = sessionId;
    if (isRoot) {
      sId = await startSession(query) || sessionId;
      setSearchOpen(true);
      response = await nlweb.search({
        query: query
      })
    } else {
      response = await nlweb.search({
        query: query,
        conversationHistory: searches.map(r => r.query)
      })
    }
    // Add to store, in the correct way
    if (sId) {
      const search = {query: query, response: response, sessionId: sId}
      await addSearch(search)
    } 
  }
  useEffect(() => {
    if (searches.length > 0 && !searchOpen) {
      setSearchOpen(true);
    }
  }, [searches])
  const rootQuery = searches.length > 0 ? searches[0].query : nlweb.query;
  return (
    <div>
      <div className="mb-6 min-w-50 max-h-12 relative z-30">
        <SearchQuery loading={nlweb.loading} handleSearch={(q) => handleSearch(q, true)}/>
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
                        loading={nlweb.loading} 
                        handleSearch={(q) => handleSearch(q, true)}
                        initQuery={rootQuery}
                      />
                    </div>
                    <ChatResults
                      nlweb={nlweb}
                      searches={searches}
                      addResults={addResults}
                      config={config}
                      anchorRef={anchorRef}
                    />
                  </div>
                </div>
                <div className='absolute pointer-events-none bottom-0 top-[calc(100%_-_100px)] bg-gradient-to-b from-transparent to-white left-0 right-0'/>
                <div className="absolute bottom-8 left-4 right-4">
                  <div className='max-w-xl mx-auto'>
                    <SearchQuery 
                      key={nlweb.query}
                      loading={nlweb.loading} 
                      handleSearch={(q) => handleSearch(q, false)}
                      inputClassName="max-h-[60vh] overflow-y-auto"
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
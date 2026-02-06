// Copyright (c) 2025 Microsoft Corporation.
// Licensed under the MIT License

import { useState, useCallback, useEffect, useRef } from 'react';
import { Thing } from 'schema-dts';
import {NlwebResult, parseSchema} from './parseSchema';


/**
 * Error response structure
 */
interface NLWebError {
    code: string;
    message: string;
}

/**
 * Search state
 */
export interface NLWebSearchState {
    results: NlwebResult[];
    resultOffset?: number;
    streamingIndex: number;
    summary?: string;
    decontextualizedQuery?: string;
    query: string | null;
    loading: boolean;
    error: string | null;
    rawLogs?: object[]
}

export interface NLWeb extends NLWebSearchState {
    search : (params: NLWebSearchParams) => Promise<SearchResponse>;
    cancelSearch : () => void;
    clearResults: () => void;
}
/**
 * Search request parameters
 */
export interface NLWebSearchParams {
    query: string;
    mode?: 'list' | 'list,summarize';
    userId?: string;
    remember?: boolean;
    conversationHistory?: string[];
    resultOffset?: number;
}

/**
 * v0.54 API Request structure
 */
export interface V054Request {
    query: {
        text: string;
        site: string;
        max_results: number; // Ranked results
        num_results: number; // Retrieval results
    };
    prefer: {
        streaming: boolean;
        response_format: 'conv_search' | 'chatgpt_app';
        mode: string;
    };
    meta: {
        api_version: string;
        user?: {
            id: string;
        };
        remember?: boolean;
        start_num?: number;
    };
    context?: {
        '@type': 'ConversationalContext';
        prev: string[];
    };
}

/**
 * Hook configuration
 */
export interface UseNlWebConfig {
    endpoint: string;
    site: string;
    maxResults?: number;
    numRetrievalResults?: number;
}


export interface SearchResponse {
    results: NlwebResult[];
    decontextualizedQuery?: string;
    summary?: string;
    rawLogs?: object[]
}

export function convertParamsToRequest(params: NLWebSearchParams, site: string, numRetrievalResults: number=50, maxResults: number=9): V054Request {
    const v054Request: V054Request = {
        query: {
            text: params.query,
            site: site,
            max_results: maxResults,
            num_results: numRetrievalResults,
        },
        prefer: {
            streaming: true,
            response_format: 'conv_search',
            mode: 'list, summarize'
        },
        meta: {
            api_version: '0.54',
            start_num: params.resultOffset || 0
        },
    };
    
    // Add user metadata if provided
    if (params.userId) {
        v054Request.meta.user = {
            id: params.userId,
        };
    }

    // Add remember flag if provided
    if (params.remember) {
        v054Request.meta.remember = true;
    }

    // Add conversation context if available
    if (params.conversationHistory && params.conversationHistory.length > 0) {
        v054Request.context = {
            '@type': 'ConversationalContext',
            prev: params.conversationHistory.slice(-5), // Last 5 queries
        };
    }

    return v054Request;
} 

/**
 * Custom hook for NLWeb search with SSE streaming support
 *
 * @param config - Hook configuration including endpoint URL
 * @returns Search state and search function
 */
export function useNlWeb(config: UseNlWebConfig):NLWeb {
    const { endpoint, site, maxResults = 9, numRetrievalResults=50 } = config;

    
    const [state, setState] = useState<NLWebSearchState>({
        results: [],
        query: null,
        error: null,
        rawLogs: [],
        streamingIndex: -1,
        loading: false
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Sort results by score in descending order
     */
    const sortResultsByScore = useCallback((results: NlwebResult[]): NlwebResult[] => {
        return [...results].sort((a, b) => {
            const scoreA = a.score || 0;
            const scoreB = b.score || 0;
            return scoreB - scoreA;
        });
    }, []);

    /**
     * Handle streaming response from NLWeb
     */
    const handleStreamingResponse = useCallback(async (
        response: Response
    ): Promise<SearchResponse> => {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        const accumulatedResults: NlwebResult[] = [];
        let summary:string = '';
        let decontextualizedQuery:string = '';
        const debugLogs:object[] = [];
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer
                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue;
                    try {
                        const dataStr = line.slice(6); // Remove 'data: ' prefix
                        const data = JSON.parse(dataStr);
                        debugLogs.push(data)
                        // Check metadata, if present
                        if (data._meta) {
                             // Check for failure response
                            if (data._meta.response_type === 'Failure' && data.error) {
                                const error: NLWebError = data.error;
                                throw new Error(`Error (${error.code}): ${error.message}`);
                            } else if (data._meta.decontextualized_query) {
                                decontextualizedQuery = data._meta.decontextualized_query;
                                 setState(prev => ({
                                    ...prev,
                                    rawLogs: debugLogs,
                                    decontextualizedQuery: decontextualizedQuery
                                }));
                            }
                        }
                        
                        // Handle v0.54 results array (conv_search format)
                        if (data.results && Array.isArray(data.results)) {
                            data.results.forEach((result: Thing) => {
                                const parsed = parseSchema(result);
                                if (parsed) {
                                    if (parsed["@type"] == 'Summary') {
                                        summary = parsed.text;
                                    } else {
                                        // Check if result already exists (by URL or name)
                                        const exists = accumulatedResults.some(item =>
                                            (item["@id"] == parsed["@id"])
                                        );

                                        if (!exists) {
                                            accumulatedResults.push(parsed);
                                        }
                                    }
                                }
                            });

                            // Sort and update state
                            const sortedResults = sortResultsByScore(accumulatedResults);
                            setState(prev => ({
                                ...prev,
                                rawLogs: debugLogs,
                                summary: summary,
                                results: sortedResults,
                                decontextualizedQuery: decontextualizedQuery
                            }));
                        }

                        // Handle v0.54 structuredData array (chatgpt_app format)
                        if (data.structuredData && Array.isArray(data.structuredData)) {
                            data.structuredData.forEach((result: NlwebResult) => {
                                // Check if result already exists (by URL or name)
                                const exists = accumulatedResults.some(item =>
                                    (item.url && item.url === result.url) ||
                                    (item.name && item.name === result.name)
                                );

                                if (!exists) {
                                    accumulatedResults.push(result);
                                }
                            });

                            // Sort and update state
                            const sortedResults = sortResultsByScore(accumulatedResults);
                            setState(prev => ({
                                ...prev,
                                rawLogs: debugLogs,
                                results: sortedResults,
                                decontextualizedQuery: decontextualizedQuery
                            }));
                        }

                    } catch (err) {
                        console.error('Error parsing SSE line:', err, 'Line:', line);
                    }
                }
            }

            return {
                results: sortResultsByScore(accumulatedResults),
                summary: summary,
                decontextualizedQuery: decontextualizedQuery,
                rawLogs: debugLogs
            }
        } finally {
            reader.releaseLock();
        }
    }, [sortResultsByScore]);

    /**
     * Perform search with streaming results
     */
    const search = useCallback(async (
        params: NLWebSearchParams
    ): Promise<SearchResponse> => {
        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        
        const query = params.query;
        const streamingIndex = params.conversationHistory ? params.conversationHistory.length : 0;
        // Reset state
        setState({
            results: [],
            query: query,
            error: null,
            rawLogs: [],
            streamingIndex: streamingIndex,
            resultOffset: params.resultOffset || 0,
            loading: true
        });

        try {
            // Build v0.54 request
            const v054Request = convertParamsToRequest(params, site, numRetrievalResults, maxResults)
            // Send POST request to get streaming response
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify(v054Request),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle streaming response
            const results = await handleStreamingResponse(response);

            // Update final state
            setState({
                results: results.results,
                summary: results.summary,
                decontextualizedQuery: results.decontextualizedQuery,
                error: null,
                query: query,
                resultOffset: params.resultOffset,
                streamingIndex: streamingIndex,
                rawLogs: results.rawLogs,
                loading: false
            });

            return results;
        } catch (error: any) {
            // Only set error if not aborted
            if (error.name !== 'AbortError') {
                const errorMessage = error.message || 'An error occurred during search';
                setState({
                    results: [],
                    query: null,
                    error: errorMessage,
                    rawLogs:[],
                    streamingIndex: streamingIndex,
                    loading: false
                });
                throw error;
            }

            // Return empty results if aborted
            return {
              results: [],
              rawLogs: []
            };
        }
    }, [endpoint, site, maxResults, handleStreamingResponse]);

    /**
     * Cancel ongoing search
     */
    const cancelSearch = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;

            setState(prev => ({
                ...prev,
                query: null,
            }));
        }
    }, []);

    /**
     * Clear results
     */
    const clearResults = useCallback(() => {
        setState({
            results: [],
            query: null,
            error: null,
            streamingIndex: -1,
            loading: false
        });
    }, []);

    useEffect(() => {
        clearResults()
    }, [site])

    return {
        ...state,
        search,
        cancelSearch,
        clearResults,
    };
}

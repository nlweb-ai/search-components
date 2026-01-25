// Copyright (c) 2025 Microsoft Corporation.
// Licensed under the MIT License

import { useState, useCallback, useRef } from 'react';
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
    summary?: string;
    decontextualizedQuery?: string;
    isLoading: boolean;
    error: string | null;
}

/**
 * Search request parameters
 */
export interface NLWebSearchParams {
    query: string;
    numResults?: number;
    mode?: 'list' | 'list,summarize';
    userId?: string;
    remember?: boolean;
    conversationHistory?: string[];
}

/**
 * Hook configuration
 */
export interface UseNlWebConfig {
    endpoint: string;
    site: string;
    maxResults?: number;
}


export interface SearchResponse {
    results: NlwebResult[];
    decontextualizedQuery?: string;
    summary?: string;
}

/**
 * Custom hook for NLWeb search with SSE streaming support
 *
 * @param config - Hook configuration including endpoint URL
 * @returns Search state and search function
 */
export function useNlWeb(config: UseNlWebConfig) {
    const { endpoint, site, maxResults = 50 } = config;

    const [state, setState] = useState<NLWebSearchState>({
        results: [],
        isLoading: false,
        error: null,
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
                        console.log(data);
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
                                summary: summary,
                                results: sortedResults,
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
                                results: sortedResults,
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
                decontextualizedQuery: decontextualizedQuery
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

        // Reset state
        setState({
            results: [],
            isLoading: true,
            error: null,
        });

        try {
            // Build v0.54 request
            const v054Request: any = {
                query: {
                    text: params.query,
                    site: site,
                    num_results: params.numResults || maxResults,
                },
                prefer: {
                    streaming: true,
                    response_format: 'conv_search',
                    mode: 'list, summarize'
                },
                meta: {
                    api_version: '0.54',
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
                isLoading: false,
                error: null,
            });

            return results;
        } catch (error: any) {
            // Only set error if not aborted
            if (error.name !== 'AbortError') {
                const errorMessage = error.message || 'An error occurred during search';
                setState({
                    results: [],
                    isLoading: false,
                    error: errorMessage,
                });
                throw error;
            }

            // Return empty results if aborted
            return {
              results: []
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
                isLoading: false,
            }));
        }
    }, []);

    /**
     * Clear results
     */
    const clearResults = useCallback(() => {
        setState({
            results: [],
            isLoading: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        search,
        cancelSearch,
        clearResults,
    };
}

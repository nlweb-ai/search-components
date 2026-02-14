import { useEffect, useRef } from 'react';
import type { SearchResponse } from './useNlWeb';

interface WebMCPToolResult {
  content: Array<{ type: string; text: string }>;
}

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (
    args: Record<string, unknown>
  ) => WebMCPToolResult | Promise<WebMCPToolResult>;
}

interface ModelContext {
  registerTool(tool: WebMCPTool): void;
  unregisterTool(name: string): void;
}

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export interface UseWebMCPOptions {
  handleSearch: (query: string) => Promise<SearchResponse>;
  site?: string;
}

/**
 * Registers a WebMCP `ask_question` tool on `navigator.modelContext`,
 * allowing in-browser AI agents to invoke searches programmatically.
 *
 * The tool is registered on mount and unregistered on unmount.
 * Re-registers when `site` changes so the description stays current.
 */
export function useWebMCP({ handleSearch, site }: UseWebMCPOptions) {
  const searchRef = useRef(handleSearch);

  useEffect(() => {
    searchRef.current = handleSearch;
  }, [handleSearch]);

  useEffect(() => {
    const mc = navigator.modelContext;
    if (!mc) return;

    mc.registerTool({
      name: 'ask_question',
      description: `Search for information and get an AI-powered summary with relevant results.${site ? ` Currently searching: ${site}` : ''}`,
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The question or search query',
          },
        },
        required: ['query'],
      },
      execute: async (args) => {
        const query = args.query as string;
        const response = await searchRef.current(query);

        const parts: string[] = [];
        if (response.summary) {
          parts.push(response.summary);
        }
        if (response.results?.length > 0) {
          parts.push(`\nFound ${response.results.length} results:`);
          for (const [i, r] of response.results.entries()) {
            const name = (r.name || r.title || 'Untitled') as string;
            const url = (r.url || r.grounding || '') as string;
            parts.push(`${i + 1}. ${name}${url ? ` - ${url}` : ''}`);
          }
        }

        return {
          content: [
            { type: 'text', text: parts.join('\n') || 'No results found.' },
          ],
        };
      },
    });

    return () => {
      mc.unregisterTool('ask_question');
    };
  }, [site]);
}

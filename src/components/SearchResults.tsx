import React from 'react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url?: string;
}

export interface SearchResultsProps {
  results: SearchResult[];
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
  className = '',
  loading = false,
  emptyMessage = 'No results found',
}) => {
  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {results.map((result) => (
        <div
          key={result.id}
          onClick={() => onResultClick?.(result)}
          className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
            onResultClick ? 'cursor-pointer' : ''
          }`}
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {result.title}
          </h3>
          {result.description && (
            <p className="mt-1 text-sm text-gray-600">{result.description}</p>
          )}
          {result.url && (
            <a
              href={result.url}
              className="mt-1 text-xs text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {result.url}
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

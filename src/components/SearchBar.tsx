import React from 'react';
import { SearchInput } from './SearchInput';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  showButton?: boolean;
  buttonText?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className = '',
  showButton = true,
  buttonText = 'Search',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  const handleButtonClick = () => {
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="flex-1" onKeyDown={handleKeyDown}>
        <SearchInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      </div>
      {showButton && (
        <button
          onClick={handleButtonClick}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

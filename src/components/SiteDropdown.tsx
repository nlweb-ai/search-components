import { useState } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { CheckIcon, GlobeAltIcon, ChevronUpDownIcon,StarIcon } from '@heroicons/react/20/solid';

export interface Site {
  featured?: boolean;
  url: string;
}

interface SiteDropdownProps {
  sites: Site[];
  selected: Site;
  onSelect: (url: string | null) => void;
  placeholder?: string;
}

export function SiteDropdown({ sites, selected, onSelect, placeholder = 'Select a site...' }: SiteDropdownProps) {
  const [query, setQuery] = useState('');

  const filteredSites =
    query === ''
      ? sites
      : sites.filter((site) => {
          return site.url.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <Combobox value={selected.url} onChange={onSelect}>
      <div className="relative w-full">
        <div className="relative flex items-center w-full cursor-default overflow-hidden rounded-lg bg-white text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
          <ComboboxInput
            className="w-full pl-8 rounded-md text-sm border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            displayValue={(site: string | null) => site || ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <ComboboxButton className="absolute inset-y-0 left-0 flex items-center pl-2">
            <GlobeAltIcon className='text-gray-400 size-4'/>
          </ComboboxButton>
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className='text-gray-400 size-4'/>
          </ComboboxButton>
        </div>
        <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
          {filteredSites.map((site) => (
            <ComboboxOption
              key={site.url}
              className={({ focus }) =>
                `relative text-sm cursor-default select-none py-2 pl-10 pr-4 ${
                  focus ? 'bg-blue-600 text-white' : 'text-gray-900'
                }`
              }
              value={site.url}
            >
              {({ selected, focus }) => (
                <>
                  <span
                    className={`block truncate ${
                      selected ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {site.url}
                  </span>
                  {selected ? (
                    <span
                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                        focus ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : null}
                  {site.featured ? (
                    <span
                      className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                        focus ? 'text-white' : 'text-blue-600'
                      }`}
                    >
                      <StarIcon className='size-5 text-yellow-500'/>
                    </span>
                  ) : null}
                </>
              )}
            </ComboboxOption>
          ))}
          {query !== '' && !sites.some(site => site.url.toLowerCase() === query.toLowerCase()) && (
            <ComboboxOption
              className={({ focus }) =>
                `relative text-sm cursor-default select-none py-2 pl-10 pr-4 ${
                  focus ? 'bg-blue-600 text-white' : 'text-gray-900'
                }`
              }
              value={query}
            >
              {({ focus }) => (
                <span className={`block truncate ${focus ? 'font-medium' : 'font-normal'}`}>
                  Use "{query}"
                </span>
              )}
            </ComboboxOption>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

# @nlweb-ai/search-components

A React component library for building search interfaces with TypeScript and Tailwind CSS.

## Features

- 🎨 **Styled with Tailwind CSS** - Beautiful, customizable components
- 📦 **TypeScript Support** - Full type definitions included
- ⚡ **Tree-shakeable** - Optimized bundle size
- 🔧 **Flexible** - Highly customizable components
- 📱 **Responsive** - Mobile-friendly designs

## Installation

This package is published to GitHub Packages. First, configure your `.npmrc`:

```bash
@nlweb-ai:registry=https://npm.pkg.github.com
```

**Authentication Required**: To install packages from GitHub Packages, you need to authenticate with a GitHub Personal Access Token (PAT) with `read:packages` scope. Add the following line to your `.npmrc`:

```bash
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Or set the token as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

Then install the package using pnpm:

```bash
pnpm add @nlweb-ai/search-components
```

Or using npm:

```bash
npm install @nlweb-ai/search-components
```

Or using yarn:

```bash
yarn add @nlweb-ai/search-components
```

## Usage

Import the components you need:

```tsx
import { SearchBar, SearchInput, SearchResults } from '@nlweb-ai/search-components';
```

> **Note**: Styles are automatically injected when you import the components. No need to import CSS separately.

### SearchInput

A basic search input field component.

```tsx
import { useState } from 'react';
import { SearchInput } from '@nlweb-ai/search-components';

function App() {
  const [query, setQuery] = useState('');

  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      placeholder="Search for anything..."
    />
  );
}
```

### SearchBar

A complete search bar with optional search button.

```tsx
import { useState } from 'react';
import { SearchBar } from '@nlweb-ai/search-components';

function App() {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    console.log('Searching for:', value);
    // Perform search logic here
  };

  return (
    <SearchBar
      value={query}
      onChange={setQuery}
      onSearch={handleSearch}
      placeholder="Search..."
      showButton={true}
      buttonText="Search"
    />
  );
}
```

### SearchResults

Display search results in a clean, organized list.

```tsx
import { SearchResults } from '@nlweb-ai/search-components';

const results = [
  {
    id: '1',
    title: 'Result Title',
    description: 'A brief description of the result',
    url: 'https://example.com',
  },
  // ... more results
];

function App() {
  const handleResultClick = (result) => {
    console.log('Clicked:', result);
  };

  return (
    <SearchResults
      results={results}
      onResultClick={handleResultClick}
      loading={false}
      emptyMessage="No results found"
    />
  );
}
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm run typecheck

# Run linting
pnpm run lint

# Format code
pnpm run format

# Build the library
pnpm run build

# Watch mode for development
pnpm run dev
```

### Publishing

The package is configured to publish to GitHub Packages. Make sure you have the proper authentication token configured.

```bash
# Build and publish
pnpm run build
pnpm publish
```

## Component Props

### SearchInput

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current input value |
| `onChange` | `(value: string) => void` | - | Callback when value changes |
| `placeholder` | `string` | `'Search...'` | Placeholder text |
| `className` | `string` | `''` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Whether input is disabled |

### SearchBar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current input value |
| `onChange` | `(value: string) => void` | - | Callback when value changes |
| `onSearch` | `(value: string) => void` | - | Callback when search is triggered |
| `placeholder` | `string` | `'Search...'` | Placeholder text |
| `className` | `string` | `''` | Additional CSS classes |
| `showButton` | `boolean` | `true` | Whether to show search button |
| `buttonText` | `string` | `'Search'` | Text for search button |

### SearchResults

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `results` | `SearchResult[]` | - | Array of search results |
| `onResultClick` | `(result: SearchResult) => void` | - | Callback when result is clicked |
| `className` | `string` | `''` | Additional CSS classes |
| `loading` | `boolean` | `false` | Whether results are loading |
| `emptyMessage` | `string` | `'No results found'` | Message when no results |

## License

MIT
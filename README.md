# @nlweb-ai/search-components

A React component library for integrating nlweb search capabilities into your applications. Built with TypeScript and Tailwind CSS.
[Playground](https://nlweb-ai.github.io/search-components/)

## Features

- 🔍 **nlweb Integration** - Connect directly to nlweb search API
- 💬 **Chat Interface** - Conversational search experience
- 🎨 **Styled with Tailwind CSS** - Beautiful, customizable components
- 📦 **TypeScript Support** - Full type definitions included
- ⚡ **Tree-shakeable** - Optimized bundle size
- 📱 **Responsive** - Mobile-friendly designs


## Installation

This package is published to GitHub Packages. First, configure your `~/.npmrc`:

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

## Components

### ChatSearch

The main component for integrating nlweb's conversational search interface into your application. It provides a complete chat-based search experience with message history, streaming responses, and rich search results.

```tsx
import { ChatSearch } from '@nlweb-ai/search-components';

function App() {
  return (
    <ChatSearch
      endpoint="https://your-nlweb-endpoint.com/ask"
      site="your-site-domain.com"
    />
  );
}
```

> **Note**: Styles are automatically injected when you import the components. No need to import CSS separately.

## Hooks

### useNlWeb Hook

A custom React hook for direct integration with the nlweb search API. Use this hook when you need more control over the search experience or want to build your own custom UI.

```tsx
import { useNlWeb } from '@nlweb-ai/search-components';

function SearchComponent() {
  const nlweb = useNlWeb({
    endpoint: 'https://your-nlweb-endpoint.com/ask',
    site: 'your-site-domain.com',
    maxResults: 50 // optional, defaults to 50
  });

  const handleSearch = async () => {
    const response = await nlweb.search({
      query: 'your search query',
      conversationHistory: [], // optional
      numResults: 10, // optional
      userId: 'user-123', // optional
      remember: true // optional
    });
  };

  return (
    <div>
      {nlweb.isLoading && <p>Loading...</p>}
      {nlweb.error && <p>Error: {nlweb.error}</p>}
      {nlweb.summary && <p>{nlweb.summary}</p>}
      <ul>
        {nlweb.results.map((result, i) => (
          <li key={i}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Examples

To see live examples and interact with the components, start the Storybook development environment:

```bash
pnpm storybook
```

This will launch an interactive playground where you can:
- See the ChatSearch component in action
- Experiment with different configurations
- Test the component with your own API key
- Explore the component's features and capabilities

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

### ChatSearch

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `endpoint` | `string` | - | The nlweb API endpoint URL (required) |
| `site` | `string` | - | The site domain to search within (required) |

### useNlWeb Hook

**Configuration:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `endpoint` | `string` | - | The nlweb API endpoint URL (required) |
| `site` | `string` | - | The site domain to search within (required) |
| `maxResults` | `number` | `50` | Maximum number of results to return |

**Returned State:**

| Property | Type | Description |
|----------|------|-------------|
| `results` | `NlwebResult[]` | Array of search results |
| `summary` | `string \| undefined` | AI-generated summary of the search results |
| `decontextualizedQuery` | `string \| undefined` | The reformulated query for better context |
| `isLoading` | `boolean` | Loading state indicator |
| `error` | `string \| null` | Error message if search fails |
| `search` | `(params: NLWebSearchParams) => Promise<SearchResponse>` | Function to perform a search |
| `cancelSearch` | `() => void` | Function to cancel ongoing search |
| `clearResults` | `() => void` | Function to clear search results |

For more detailed usage examples and advanced configurations, please refer to the Storybook documentation (run `pnpm storybook`).

## License

MIT

# @nlweb-ai/search-components

A React component library for integrating nlweb search capabilities into your applications. Built with TypeScript and Tailwind CSS.

## Features

- 🔍 **nlweb Integration** - Connect directly to nlweb search API
- 💬 **Chat Interface** - Conversational search experience
- 🎨 **Styled with Tailwind CSS** - Beautiful, customizable components
- 📦 **TypeScript Support** - Full type definitions included
- ⚡ **Tree-shakeable** - Optimized bundle size
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

## Components

### ChatSearch

The main component for integrating nlweb's conversational search interface into your application. It provides a complete chat-based search experience with message history, streaming responses, and rich search results.

```tsx
import { ChatSearch } from '@nlweb-ai/search-components';

function App() {
  return (
    <ChatSearch
      apiKey="your-nlweb-api-key"
      placeholder="Ask me anything..."
    />
  );
}
```

> **Note**: Styles are automatically injected when you import the components. No need to import CSS separately.

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
| `apiKey` | `string` | - | Your nlweb API key (required) |
| `placeholder` | `string` | `'Ask me anything...'` | Placeholder text for the input |
| `className` | `string` | `''` | Additional CSS classes for the container |
| `onError` | `(error: Error) => void` | - | Callback when an error occurs |

For more detailed usage examples and advanced configurations, please refer to the Storybook documentation (run `pnpm storybook`).

## License

MIT
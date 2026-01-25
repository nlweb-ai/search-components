import type { Meta, StoryObj } from '@storybook/react';
import { ChatSearch } from '../components/ChatSearch';

const NEW_ENDPOINT_WITH_60_SITES = "https://fwbrdyftb6bvdvgs.fz47.alb.azure.com/ask"
const OLD_ENDPOINT = "https://fmfpc5c0aydvf2ft.fz93.alb.azure.com/ask"

/**
 * useNlWeb is a React hook that provides search functionality with streaming SSE support.
 *
 * Features:
 * - Streaming search results as they arrive
 * - Automatic result deduplication and sorting by score
 * - AI-generated summaries
 * - Conversation history support
 * - Request cancellation
 * - Error handling
 *
 * The hook returns:
 * - `results`: Array of search results
 * - `summary`: AI-generated summary of results (optional)
 * - `decontextualizedQuery`: Processed query (optional)
 * - `isLoading`: Loading state
 * - `error`: Error message (if any)
 * - `search`: Function to initiate a search
 * - `cancelSearch`: Function to cancel ongoing search
 * - `clearResults`: Function to clear results
 *
 * This story demonstrates the hook through the ChatSearch component, which uses useNlWeb internally.
 */
const meta: Meta<typeof ChatSearch> = {
  title: 'Hooks/useNlWeb',
  component: ChatSearch,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A React hook for integrating nlweb search with streaming support, state management, and conversation context. The ChatSearch component below uses this hook internally.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    endpoint: {
      control: 'select',
      description: 'The API endpoint URL for the NLWeb search service.',
      options: [
        OLD_ENDPOINT,
        NEW_ENDPOINT_WITH_60_SITES,
      ],
    },
    site: {
      control: 'select',
      description: 'The target site domain to search within.',
      options: [
        'yoast-site-recipes.azurewebsites.net',
        'yoast-site-rss.azurewebsites.net',
        'ambitiouskitchen.com',
      ],
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'yoast-site-recipes.azurewebsites.net' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatSearch>;

/**
 * Default story showing the useNlWeb hook in action through ChatSearch component.
 *
 * The ChatSearch component uses the useNlWeb hook internally to provide:
 * - Streaming search results
 * - AI-generated summaries
 * - Conversation history management
 * - Error handling and loading states
 *
 * **How to use:**
 * 1. Click the search input to open the chat dialog
 * 2. Type a search query and press Enter
 * 3. Watch as results stream in real-time
 * 4. View the AI-generated summary
 * 5. Ask follow-up questions for conversational search
 */
export const Default: Story = {
  args: {
    endpoint: OLD_ENDPOINT,
    site: 'yoast-site-recipes.azurewebsites.net',
  },
  render: (args) => (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">useNlWeb Hook Demo</h1>
      <p className="text-gray-600 mb-6">
        The ChatSearch component below uses the useNlWeb hook to provide streaming search functionality.
      </p>
      <ChatSearch {...args} />
    </div>
  ),
};

/**
 * Example with AmbitiousKitchen site
 */
export const AmbitiousKitchenSearch: Story = {
  args: {
    endpoint: NEW_ENDPOINT_WITH_60_SITES,
    site: 'ambitiouskitchen.com',
  },
  render: (args) => (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ambitious Kitchen Search Example</h1>
      <p className="text-gray-600 mb-6">
        Search GitHub content using the useNlWeb hook.
      </p>
      <ChatSearch {...args} />
    </div>
  ),
};

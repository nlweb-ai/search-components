import type { Meta, StoryObj } from '@storybook/react';
import { ChatSearch } from './ChatSearch';

const NEW_ENDPOINT_WITH_60_SITES = "https://fwbrdyftb6bvdvgs.fz47.alb.azure.com/ask"
const OLD_ENDPOINT = "https://fmfpc5c0aydvf2ft.fz93.alb.azure.com/ask"


/**
 * ChatSearch provides an interactive conversational search experience with AI-powered summaries.
 *
 * The component features:
 * - A search input that opens a full-screen dialog
 * - AI-generated summaries of search results
 * - Visual result cards with thumbnails
 * - Follow-up query support for conversational search
 * - Streaming results as they load
 */
const meta: Meta<typeof ChatSearch> = {
  title: 'Components/ChatSearch',
  component: ChatSearch,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    endpoint: {
      control: 'select',
      description: 'The API endpoint URL for the NLWeb search service. This endpoint handles search queries and returns AI-generated summaries with results.',
      options: [
        OLD_ENDPOINT,
        NEW_ENDPOINT_WITH_60_SITES,
      ],
    },
    site: {
      control: 'select',
      description: 'The target site domain to search within. The search will be scoped to content from this specific site.',
      options: [
        'yoast-site-recipes.azurewebsites.net',
        'yoast-site-rss.azurewebsites.net',
        'github.com',
        'techcrunch.com',
        '9to5mac.com',
        'boingboing.net',
        'crackmagazine.net',
        'valuewalk.com',
        'thewaltdisneycompany.com',
        'capgemini.com',
        'plesk.com',
        'siteminder.com',
        'boingo.com',
        'adespresso.com',
        'loggly.com',
        'modpizza.com',
        'cpanel.net',
        'harvard.edu',
        'news.harvard.edu',
        'skillcrush.com',
        'polk.edu',
        'creativecommons.org',
        'rollingstones.com',
        'katyperry.com',
        'usainbolt.com',
        'rafaelnadal.com',
        'snoopdogg.com',
        'riverdance.com',
        'news.microsoft.com',
        'blog.mozilla.org',
        'news.spotify.com',
        'nationalarchives.gov.uk',
        'blog.cpanel.com',
        'news.sap.com',
        'finland.fi',
        'blogs.cisco.com',
        'blog.turbotax.intuit.com',
        'blog.alaskaair.com',
        'airstream.com',
        'wolverineworldwide.com',
        'kff.org',
        'invisiblechildren.com',
        'platformlondon.org',
        'travelportland.com',
        'tim.blog',
        'garyvaynerchuk.com',
        'athemes.com',
        'generatepress.com',
        'wpexplorer.com',
        'studiopress.com',
        'yoast.com',
        'portent.com',
        'tri.be',
        'hmn.md',
        'renweb.com',
        'yelpblog.com',
        'sprott.carleton.ca',
        'pacificrimcollege.online',
        'bytes.co',
        'talentodigital.madrid.es',
        'soapstones.com',
        'codefryx.de',
        'centremarceau.com',
        'riponcathedral.org.uk',
        'engineering.fb.com',
        'blog.pagely.com',
        'daybreaker.com',
        'taylorswift.com',
        'hodgebank.co.uk',
        'newsroom.spotify.com',
        'books.disney.com',
        'vanyaland.com',
        'gizmodo.com',
        'kotaku.com',
        'jezebel.com',
        'theonion.com',
        'avclub.com',
        'clickhole.com',
        'usmagazine.com',
        'hongkiat.com',
        'speckyboy.com',
        'arianagrande.com',
        'postmalone.com',
        'rihanna.com',
        'foofighters.com',
        'vice.com',
        'pinchofyum.com',
        'minimalistbaker.com',
        'cookieandkate.com',
        'skinnytaste.com',
        'budgetbytes.com',
        'sallysbakingaddiction.com',
        'halfbakedharvest.com',
        'theeverygirl.com',
        'entrepreneur.com',
        'thefashionspot.com',
        'outsideonline.com',
        'backpacker.com',
        'trailrunnermag.com',
        'climbing.com',
        'cafemom.com',
        'greenweddingshoes.com',
        'recipetineats.com',
        'onceuponachef.com',
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
 * Default ChatSearch implementation using the standard endpoint and site.
 *
 * **Usage:**
 * 1. Enter a search query in the input field
 * 2. Press Enter or click the submit button
 * 3. View AI-generated summary and results in the full-screen dialog
 * 4. Ask follow-up questions using the bottom search bar
 */
export const Default: Story = {
  args: {
    endpoint: OLD_ENDPOINT,
    site: 'yoast-site-recipes.azurewebsites.net',
  },
  render: (args) => (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">NLWeb Chat Search Playground</h1>
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Using:</span>
          <span className="px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-full text-purple-700 font-medium">
            {args.endpoint == OLD_ENDPOINT ? 'Dev NLWeb' : 'Prod NLWeb'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Searching:</span>
          <span className="px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 font-medium">
            {args.site}
          </span>
        </div>
      </div>
      <ChatSearch {...args} />
      <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This example is driven by the endpoint and site parameters,
          available in the controls section.
        </p>
      </div>
    </div>
  ),
};

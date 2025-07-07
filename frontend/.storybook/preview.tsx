import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // Docs addon configuration
    docs: {
      toc: true,
      autodocs: 'tag',
    },

    // Backgrounds addon configuration
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0a0a0a' },
        { name: 'gray-50', value: '#f9fafb' },
        { name: 'gray-100', value: '#f3f4f6' },
      ],
    },

    // Viewport addon configuration
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        mobileLarge: {
          name: 'Mobile Large',
          styles: { width: '414px', height: '896px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1024px', height: '768px' },
        },
        desktopLarge: {
          name: 'Desktop Large',
          styles: { width: '1440px', height: '900px' },
        },
        widescreen: {
          name: 'Widescreen',
          styles: { width: '1920px', height: '1080px' },
        },
      },
    },

    // A11y addon configuration
    a11y: {
      element: '#storybook-root',
      config: {},
      options: {},
      manual: true,
    },

    // Layout configuration
    layout: 'centered',
  },

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';

      return (
        <div className={theme === 'dark' ? 'dark' : ''}>
          <div className="min-h-screen bg-background p-4 text-foreground transition-colors">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;

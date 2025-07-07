import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    '@storybook/addon-a11y',
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {},
  },

  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldExtractValuesFromUnion: true,
      propFilter: prop => {
        if (prop.parent) {
          return !/node_modules/.test(prop.parent.fileName);
        }
        return true;
      },
      componentNameResolver: (exp, source) => {
        // コンポーネント名を適切に解決
        if (exp.getName && exp.getName() === 'default') {
          return source.fileName
            .split('/')
            .pop()
            ?.replace(/\.(tsx?|jsx?)$/, '');
        }
        return undefined;
      },
      savePropValueAsString: true,
    },
  },

  features: {
    buildStoriesJson: true,
  },

  docs: {
    autodocs: 'tag',
  },

  staticDirs: ['../public'],
};

export default config;

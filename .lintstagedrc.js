module.exports = {
  // Frontend JavaScript/TypeScript files
  'raincoat_frontend/**/*.{ts,tsx,js,jsx}': (filenames) => {
    const files = filenames.map(f => f.replace(/^raincoat_frontend\//, ''));
    return [
      `cd raincoat_frontend && eslint --fix ${files.join(' ')}`,
      `npx prettier --write ${filenames.join(' ')}`,
    ];
  },

  // Frontend styles and config files
  'raincoat_frontend/**/*.{css,json,md}': (filenames) => {
    return `npx prettier --write ${filenames.join(' ')}`;
  },

  // Backend Ruby files
  'raincoat_api/**/*.rb': (filenames) => {
    const files = filenames.map(f => f.replace(/^raincoat_api\//, ''));
    return `cd raincoat_api && bundle exec rubocop -A ${files.join(' ')}`;
  },

  // Backend config files
  'raincoat_api/**/*.{yml,yaml,json}': (filenames) => {
    return `npx prettier --write ${filenames.join(' ')}`;
  },

  // Root level config files
  '*.{json,md,yml,yaml}': (filenames) => {
    return `npx prettier --write ${filenames.join(' ')}`;
  },
};

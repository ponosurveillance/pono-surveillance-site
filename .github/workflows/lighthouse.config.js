// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        'https://v0-apartment-surveillance-package.vercel.app/',
        'https://v0-apartment-surveillance-package.vercel.app/locations',
      ],
      settings: {
        chromeFlags: '--no-sandbox',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

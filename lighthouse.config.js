// lighthouse.config.js
// Minimal config: collect a couple of URLs and upload the report to temp public storage
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        'https://v0-apartment-surveillance-package.vercel.app/',  // home
        'https://v0-apartment-surveillance-package.vercel.app/locations', // locations index (adjust if needed)
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

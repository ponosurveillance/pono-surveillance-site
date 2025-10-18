/** @type {import('lighthouse').Flags} */
module.exports = {
  ci: {
    collect: {
      // Use the canonical domain for audits
      url: ["https://www.ponosurveillance.com/"],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.95 }],
      },
    },
  },
};

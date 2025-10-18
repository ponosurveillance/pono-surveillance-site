name: Lighthouse CI

on:
  workflow_dispatch:

jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            https://v0-apartment-surveillance-package.vercel.app/
            https://v0-apartment-surveillance-package.vercel.app/locations
          uploadArtifacts: true
          temporaryPublicStorage: true

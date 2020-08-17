# 🚀🎬 Deploy PR Action

This is a GitHub Action that automatically deploys every pull request as a static site using [Surge.sh](https://surge.sh).

[![Test CI](https://github.com/koj-co/deploy-pr-action/workflows/Test%20CI/badge.svg)](https://github.com/koj-co/deploy-pr-action/actions?query=workflow%3A%22Test+CI%22)
[![Release CI](https://github.com/koj-co/deploy-pr-action/workflows/Release%20CI/badge.svg)](https://github.com/koj-co/deploy-pr-action/actions?query=workflow%3A%22Release+CI%22)
[![Node CI](https://github.com/koj-co/deploy-pr-action/workflows/Node%20CI/badge.svg)](https://github.com/koj-co/deploy-pr-action/actions?query=workflow%3A%22Node+CI%22)

## ⭐ Features

- Auto-deploy every PR and branch to its unique environment
- Unlimited free static site deployments, thanks to [Surge.sh](https://surge.sh)
- No search engine indexing for branch sites (`robots.txt` injection)
- Label and comment on PRs with the deployment and log URLs
- Update your staging GitHub environment status

## ⚙️ Usage

### Inputs

#### `prefix`

Prefix for deployment URL, e.g., `example` will translate to https://example-PR_NAME.surge.sh

#### `robotsTxtPath`

Generate a `robots.txt` file to prevent search engines from indexing the deployment

#### `distDir`

The directory to deploy, for example `dist` or `public`

### Environment variables

#### `GITHUB_TOKEN`

The GitHub token is required to add labels, comments, etc., on the PR: `GITHUB_TOKEN: ${{ secrets.GH_PAT }}`

### Example

```yaml
name: Deploy CI
on:
  pull_request:
    types:
      - opened
      - edited
      - synchronize
jobs:
  release:
    name: Deploy website
    runs-on: ubuntu-18.04
    steps:
      - name: Checkout
        uses: actions/checkout@v1
      - name: Setup Node.js
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: Install dependencies
        run: npm ci
      - name: Build static site
        run: npm run build # Build your website
      - name: Deploy
        uses: koj-co/deploy-pr-action@v1.0.1
        with:
          prefix: example # Prefix for deployment URL
          robotsTxtPath: dist/robots.txt # Add robots.txt file
          distDir: dist # Path to dist directory
        env:
          GITHUB_TOKEN: ${{ secrets.GH_PAT }}
```

## 📄 License

- Code: [MIT](./LICENSE) © [Koj](https://koj.co)
- "GitHub" is a trademark of GitHub, Inc.

<p align="center">
  <a href="https://koj.co">
    <img width="44" alt="Koj" src="https://kojcdn.com/v1593890002/website-v2/logo_mcxuwq.svg">
  </a>
</p>
<p align="center">
  <sub>An open source project by <a href="https://koj.co">Koj</a>. <br> <a href="https://koj.co">Furnish your home in style, for as low as CHF175/month →</a></sub>
</p>

# PayPass CI/CD & GitHub Pages Setup Guide

This guide outlines the steps to activate the automated testing and deployment pipeline for the PayPass platform.

## 1. GitHub Actions Workflows

I have implemented three specialized workflows to manage the project's lifecycle:

*   **`ci-cd.yml`**: The primary pipeline that runs on every push to `main` or `develop`. It handles linting, testing, building both frontend and backend, and deploying the UI to GitHub Pages.
*   **`pr-validation.yml`**: Validates pull requests by checking titles, database schema changes, and documentation standards.
*   **`release.yml`**: Manages the creation of GitHub Releases when a new version tag (e.g., `v1.0.0`) is pushed.

## 2. Activating GitHub Pages

To host the PayPass UI on GitHub Pages, follow these steps in your GitHub repository:

1.  Go to **Settings** > **Pages**.
2.  Under **Build and deployment** > **Source**, select **GitHub Actions**.
3.  The `ci-cd.yml` workflow is already configured to deploy the `dist/public` folder to the `github-pages` environment.
4.  Once the first workflow run completes, your UI will be live at: `https://<your-username>.github.io/pay-pass-scan-and-go/`

## 3. Environment Secrets

For the workflows to run successfully, you should add the following secrets to your GitHub repository (**Settings** > **Secrets and variables** > **Actions**):

| Secret Name | Description |
| :--- | :--- |
| `DATABASE_URL` | Your Neon/PostgreSQL connection string (required for schema validation). |
| `PAYNOW_INTEGRATION_ID` | Your Paynow Integration ID (23074). |
| `PAYNOW_INTEGRATION_KEY` | Your Paynow Integration Key. |
| `CODECOV_TOKEN` | (Optional) Token for uploading coverage reports to Codecov. |

## 4. Local Testing & Build

You can run the build and test processes locally using the following commands:

```bash
# Install dependencies
npm install

# Run unit tests
npm run test:unit

# Build frontend for GitHub Pages
VITE_PUBLIC_URL=/pay-pass-scan-and-go/ npx vite build -c vite.config.pages.ts

# Build backend (Next.js)
npm run api:build
```

## 5. Mock API for Demo Mode

I have implemented a `MockAPIService` (`client/src/services/mock-api.ts`) that allows the UI to function without a live backend. This is particularly useful for:
*   **GitHub Pages Demos**: Showing the UI functionality without needing a running server.
*   **Incremental Development**: Testing UI changes before the corresponding backend endpoints are fully deployed.
*   **Offline Testing**: Developing features without an internet connection.

To enable demo mode in the UI, set `VITE_ENABLE_DEMO_MODE=true` in your environment configuration.

---
*Setup by: Manus AI*
*Date: ${new Date().toISOString()}*

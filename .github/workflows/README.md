# Deployment Workflow System

## Overview

This repository uses a two-stage deployment system to ensure that deployment events are triggered with access to the most recent artifacts.

## Workflows

### 1. Main Workflow (`.github/workflows/main.yaml`)
- **Trigger**: Push to main branch or manual dispatch
- **Purpose**: Builds and tests the application
- **Jobs**:
  - `backend`: Builds Go API and pushes Docker images to GHCR
  - `frontend`: Builds React app and uploads build artifacts

### 2. Deploy Dispatch Workflow (`.github/workflows/deploy-dispatch.yaml`)
- **Trigger**: Completion of the Main workflow (via `workflow_run`)
- **Purpose**: Triggers deployment in the `xtp-tour-deploy` repository with access to recent artifacts
- **Jobs**:
  - `trigger-deploy`: Downloads artifacts and dispatches deployment event

## How It Works

1. **Main Workflow Execution**: When code is pushed to main or manually triggered, the main workflow:
   - Builds the backend API and pushes Docker images with tags:
     - `ghcr.io/xtp-tour/xtp-tour/api:<short-sha>`
     - `ghcr.io/xtp-tour/xtp-tour/api:<full-sha>-test`
   - Builds the frontend and uploads artifacts as `frontend-build`

2. **Deploy Dispatch Execution**: After the main workflow completes successfully:
   - Downloads the frontend artifacts from the completed workflow run
   - Calculates the correct Docker image tags based on the commit SHA
   - Sends a repository dispatch event to `xtp-tour-deploy` with:
     - Repository information
     - Commit SHA and branch
     - Docker image tags
     - Workflow run ID for reference
     - Frontend artifacts availability flag
   - Re-uploads artifacts with a deployment-specific name for easy access

## Payload Structure

The deployment dispatch event includes the following payload:

```json
{
  "event_type": "deploy",
  "client_payload": {
    "repository": "xtp-tour/xtp-tour",
    "ref": "main",
    "sha": "<full-commit-sha>",
    "workflow_run_id": "<workflow-run-id>",
    "api_image": "ghcr.io/xtp-tour/xtp-tour/api:<short-sha>",
    "api_test_image": "ghcr.io/xtp-tour/xtp-tour/api:<full-sha>-test",
    "frontend_artifacts_available": "true"
  }
}
```

## Benefits

1. **Artifact Access**: The deployment workflow has guaranteed access to the artifacts from the build
2. **Separation of Concerns**: Build and deployment dispatch are separate, making debugging easier
3. **Reliability**: Deployment only triggers if the build workflow completes successfully
4. **Traceability**: Full workflow run ID is included for debugging and artifact tracking

## Required Secrets

- `DEPLOY_GITHUB_TOKEN`: Token with access to trigger repository dispatch events in the `xtp-tour-deploy` repository

## Troubleshooting

If deployment isn't triggering:
1. Check that the Main workflow completed successfully
2. Verify the `DEPLOY_GITHUB_TOKEN` secret has the correct permissions
3. Check the Deploy Dispatch workflow logs for artifact download issues
4. Ensure the `xtp-tour-deploy` repository is configured to handle `deploy` dispatch events
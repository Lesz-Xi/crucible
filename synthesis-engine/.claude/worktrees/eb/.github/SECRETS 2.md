# GitHub Secrets Configuration

This document lists the required GitHub Secrets for CI/CD workflows in this repository.

## Required Secrets

### M6 Health Check Workflow

The `.github/workflows/m6-health-check.yml` workflow requires the following secrets:

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (required for admin checks) | Supabase Dashboard → Project Settings → API → `service_role` key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models | https://console.anthropic.com/ → API Keys |
| `GOOGLE_API_KEY` | Google API key for Gemini models | https://aistudio.google.com/app/apikey |

## How to Add Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name listed above
5. Click **Add secret**

## Verification

After adding secrets, you can manually trigger the workflow:

1. Go to **Actions** → **M6 Benchmark Health Check**
2. Click **Run workflow**
3. Select branch and click **Run workflow**

If secrets are correctly configured, the workflow should complete successfully.

## Security Notes

- **Never commit secrets to the repository**
- Use secrets only in GitHub Actions workflows
- Rotate secrets periodically
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, and `GOOGLE_API_KEY` private

## Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `PROMOTION_ACTOR_USER_ID` | Optional actor id for non-dry-run promotions in CI. Not required for the M6 dry-run workflow. |

## Troubleshooting

### Workflow fails with "missing secret"

Check that:
1. Secret names match exactly (case-sensitive)
2. Secrets are added to the correct repository
3. Workflow has access to secrets (not blocked by branch protection rules)

### API rate limits

If you see excessive retry/fallback events:
1. Check API quota limits in provider dashboards
2. Consider adjusting workflow schedule (reduce frequency)
3. Review retry backoff configuration in `resilient-ai-orchestrator.ts`

# GitHub Webhook Setup Guide

This guide explains how to configure GitHub webhooks for real-time cache invalidation on lucid.cards.

## Overview

The webhook system allows your Next.js app to receive real-time notifications when content is pushed to your GitHub repository. This eliminates the need for frequent polling and significantly reduces API rate limit usage.

## How It Works

1. **Push Event**: When you push changes to the `prolix-oc/ST-Presets` repository
2. **GitHub Notification**: GitHub sends a POST request to your webhook endpoint
3. **Signature Verification**: Your app verifies the request is authentic using a shared secret
4. **Selective Invalidation**: Only the cache entries for modified files are invalidated
5. **Background Refresh**: Affected cache entries are refreshed on the next request

## Benefits

- **Real-time updates**: Cache updates immediately when content changes
- **Reduced API usage**: Periodic refresh interval extended from 45 seconds to 15 minutes
- **Selective invalidation**: Only affected cache entries are updated
- **Better rate limit management**: With 5000 requests/hour, you'll use ~20 requests for periodic refresh instead of ~80

## GitHub Webhook Configuration

### Step 1: Navigate to Webhook Settings

1. Go to your repository: `https://github.com/prolix-oc/ST-Presets`
2. Click on **Settings** (requires admin access)
3. In the left sidebar, click **Webhooks**
4. Click **Add webhook** button

### Step 2: Configure Webhook

Enter the following configuration:

#### Payload URL
```
https://lucid.cards/api/webhooks/github
```

#### Content type
Select: `application/json`

#### Secret
Enter the secret from your `.env.local` file:
```
wh_sec_lucid_cards_2025_prod_b8f3a9c7e2d4f6a1
```

**Important**: This secret must match the `GITHUB_WEBHOOK_SECRET` value in your `.env.local` file. Keep it secure!

#### SSL verification
Select: `Enable SSL verification` (recommended)

#### Which events would you like to trigger this webhook?

Select: **Let me select individual events**

Then check **only** these events:
- ✅ **Pushes** - This is the primary event we need

You can optionally enable:
- ✅ **Releases** - If you want cache updates when releases are created

**Uncheck** "Pull requests" and other events unless you specifically need them.

#### Active
Ensure the **Active** checkbox is checked.

### Step 3: Save

Click **Add webhook** to save the configuration.

## Verification

### Test the Webhook

1. After saving, GitHub will send a test ping. Check the webhook page for:
   - Green checkmark ✓ indicating successful delivery
   - Status code 200 OK

2. You can also test manually:
   ```bash
   curl https://lucid.cards/api/webhooks/github
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "configured": true,
     "message": "Webhook endpoint is ready to receive events"
   }
   ```

### Monitor Webhook Activity

On the webhook settings page, you can:
- View recent deliveries
- See request/response details
- Redeliver failed requests
- Check for errors

## How Cache Invalidation Works

When a push event is received, the webhook endpoint:

1. **Verifies the signature** to ensure the request is from GitHub
2. **Parses the commit data** to identify changed files
3. **Extracts directory paths** that need cache invalidation
4. **Invalidates cache entries** for:
   - All parent directories of changed files
   - Commit caches for those paths
   - Top-level categories if files within them changed

### Example

If you push a change to:
```
Character Cards/Fantasy/Gandalf/gandalf_v2.json
```

The webhook will invalidate cache for:
- `Character Cards/Fantasy/Gandalf` (the character directory)
- `Character Cards/Fantasy` (the category)
- Commit caches for both paths

Next time someone visits the Gandalf character page, fresh data will be fetched from GitHub.

## Rate Limit Impact

### Before Webhooks
- Periodic refresh: Every 45 seconds
- API calls per hour: ~80 refresh cycles
- Rate limit usage: High (approaching the 5000/hour limit)

### After Webhooks
- Periodic refresh: Every 15 minutes (as safety net)
- API calls per hour: ~4 refresh cycles + webhook-triggered fetches
- Rate limit usage: Minimal (10-20 requests/hour for periodic refresh)

This gives you much more headroom for actual user requests!

## Hybrid Approach

The system uses a **hybrid approach** for maximum reliability:

1. **Primary**: Webhook-based real-time cache updates
2. **Fallback**: 15-minute periodic refresh as a safety net

This ensures:
- Immediate updates when webhooks work correctly
- Eventually consistent cache even if webhooks fail
- Resilience against webhook delivery issues

## Troubleshooting

### Webhook Not Firing

1. Check the webhook settings page for failed deliveries
2. Verify the Payload URL is correct: `https://lucid.cards/api/webhooks/github`
3. Ensure SSL verification is enabled
4. Check that "Pushes" event is selected

### Signature Verification Failing

1. Verify the secret in `.env.local` matches the GitHub webhook secret exactly
2. No extra spaces or characters in the secret
3. Restart your Next.js server after updating `.env.local`

### Cache Not Updating

1. Check server logs for `[Webhook]` messages
2. Verify the webhook delivery was successful (200 OK)
3. Check which paths were invalidated in the logs
4. Test by visiting the affected pages

### View Logs

To see webhook activity in your deployment:
```bash
# If using Vercel
vercel logs

# Look for messages like:
# [Webhook] Received push event for prolix-oc/ST-Presets
# [Webhook] Invalidated X cache entries for Y paths
```

## Security Considerations

1. **Keep the webhook secret secure**: Never commit it to version control
2. **Signature verification**: Always enabled to prevent unauthorized cache manipulation
3. **SSL verification**: Always use HTTPS for webhook delivery
4. **Rate limiting**: The endpoint doesn't implement rate limiting, relying on GitHub's IP ranges

## Advanced Configuration

### Multiple Environments

If you have staging/production environments:

**Production** (lucid.cards):
```
Payload URL: https://lucid.cards/api/webhooks/github
Secret: wh_sec_lucid_cards_2025_prod_b8f3a9c7e2d4f6a1
```

**Staging** (staging.lucid.cards):
```
Payload URL: https://staging.lucid.cards/api/webhooks/github
Secret: wh_sec_lucid_cards_2025_staging_xyz123456
```

Create separate webhooks for each environment with different secrets.

### Webhook Payload Example

Here's an example of what GitHub sends:

```json
{
  "ref": "refs/heads/main",
  "commits": [
    {
      "id": "abc123...",
      "message": "Update Gandalf character",
      "timestamp": "2025-11-08T18:00:00Z",
      "added": [],
      "modified": [
        "Character Cards/Fantasy/Gandalf/gandalf_v2.json"
      ],
      "removed": []
    }
  ],
  "repository": {
    "name": "ST-Presets",
    "full_name": "prolix-oc/ST-Presets"
  }
}
```

## Summary

Once configured, your webhook setup provides:

✅ **Real-time cache updates** when you push changes  
✅ **Reduced API usage** from ~80 to ~20 requests/hour  
✅ **Selective invalidation** of only affected cache entries  
✅ **Automatic fallback** with 15-minute periodic refresh  
✅ **Better rate limit management** for the 5000/hour limit  

The system is production-ready and will automatically handle cache invalidation whenever you push changes to your repository!

# Custom Domain Setup Guide for PayPass

## Overview
This guide provides instructions for deploying the PayPass application to your custom domain `paypass.website` using GitHub Pages.

## Current Status
- **Repository**: `kudzimusar/pay-pass-scan-and-go`
- **GitHub Pages URL**: `https://kudzimusar.github.io/pay-pass-scan-and-go/`
- **Custom Domain**: `paypass.website`
- **CNAME File**: ✅ Added to `public/CNAME`

## DNS Configuration

### Step 1: Update DNS Records at Your Domain Registrar

Log in to your domain registrar's control panel and update the DNS records for `paypass.website`:

#### A Records (for root domain)
Add these four A records pointing to GitHub Pages servers:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

#### CNAME Record (for www subdomain)
Add a CNAME record:
- **Name**: `www`
- **Target**: `kudzimusar.github.io`

### Step 2: Verify DNS Propagation
After updating DNS records, wait for propagation (usually 15 minutes to 24 hours):
```bash
# Check A records
nslookup paypass.website

# Check CNAME records
nslookup www.paypass.website
```

### Step 3: Configure GitHub Pages

1. Go to your repository: https://github.com/kudzimusar/pay-pass-scan-and-go
2. Navigate to **Settings** > **Pages**
3. Under **Custom domain**, enter: `paypass.website`
4. Click **Save**
5. Wait for GitHub to verify the domain (usually a few minutes)
6. Once verified, check **Enforce HTTPS** to enable SSL/TLS

## SSL/HTTPS Certificate

GitHub Pages automatically provides a free SSL certificate via Let's Encrypt. Once DNS is properly configured:
- GitHub will automatically issue an HTTPS certificate
- It may take 15-30 minutes to become available
- Check the **Enforce HTTPS** option once it appears

## Troubleshooting

### Issue: "Domain already in use"
- **Cause**: The domain might be configured on another GitHub repository
- **Solution**: Remove the domain from the other repository first

### Issue: "DNS check failed"
- **Cause**: DNS records haven't propagated yet
- **Solution**: Wait 15-30 minutes and try again, or verify your DNS records are correct

### Issue: "HTTPS not available"
- **Cause**: DNS is not properly configured
- **Solution**: Verify all A records and CNAME records are correctly set

## Verification Steps

Once DNS is configured and GitHub Pages is set up:

1. **Check the CNAME file exists**:
   ```bash
   curl https://paypass.website/CNAME
   # Should output: paypass.website
   ```

2. **Verify the site is accessible**:
   ```bash
   curl -I https://paypass.website/
   # Should return HTTP 200 OK
   ```

3. **Test the application**:
   - Open https://paypass.website/ in your browser
   - You should see the PayPass login page
   - Test the mock API features (login, payments, etc.)

## Deployment Workflow

Every time you push to the `main` branch:
1. GitHub Actions automatically builds the frontend
2. Artifacts are deployed to GitHub Pages
3. Both URLs are updated:
   - `https://kudzimusar.github.io/pay-pass-scan-and-go/`
   - `https://paypass.website/`

## Environment Configuration

The frontend is configured to work in **Mock Mode** by default. To connect to a live backend:

1. Update `.env.local` with your backend URL
2. Modify the API client in `client/src/services/api.ts`
3. Push the changes to trigger a new deployment

## Support

For DNS issues, contact your domain registrar's support team. For GitHub Pages issues, refer to the [GitHub Pages documentation](https://docs.github.com/en/pages).

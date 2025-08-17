# 🚀 Deploy to Vercel - Step by Step Guide

This guide will walk you through deploying your Schedule Editor app to Vercel.

## ✅ Prerequisites

1. **GitHub Account** with your code pushed to a repository
2. **Vercel Account** (free at [vercel.com](https://vercel.com))
3. **Supabase Project** set up and configured
4. **OpenAI API Key** ready

## 🎯 Step 1: Prepare Your Code

### 1.1 Supabase Configuration (SECURE WAY)

**IMPORTANT**: The code is now secure and you DON'T need to edit any JavaScript files with sensitive data!

The app automatically fetches configuration from the server, which gets it from environment variables. This keeps your sensitive data secure.

**What you DON'T need to do:**
- ❌ Edit `public/js/supabase-client.js` with your credentials
- ❌ Put API keys in JavaScript files
- ❌ Commit sensitive data to Git

**What you DO need to do:**
- ✅ Set environment variables in Vercel (see Step 2.3)
- ✅ The app will automatically work once deployed

### 1.2 Commit and Push Changes

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing your Schedule Editor

### 2.2 Configure Project Settings

**Project Name**: `schedule-editor` (or your preferred name)
**Framework Preset**: `Node.js`
**Root Directory**: `./` (leave as default)
**Build Command**: `npm run build` (Vercel will auto-detect)
**Output Directory**: `public` (Vercel will auto-detect)

### 2.3 Set Environment Variables

**CRITICAL**: You must set these environment variables in Vercel:

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://your-project-id.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key` | Supabase service role key |
| `OPENAI_API_KEY` | `your_openai_api_key` | Your OpenAI API key |
| `NODE_ENV` | `production` | Set to production |

**To set these:**
1. In Vercel project settings, go to "Environment Variables"
2. Add each variable with its value
3. Make sure "Production" is checked for all

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 1-2 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## 🔧 Step 3: Verify Deployment

### 3.1 Check the App

1. Visit your Vercel URL
2. You should see the login/signup page
3. Try creating an account
4. Test the schedule functionality

### 3.2 Check Console for Errors

1. Open browser DevTools (F12)
2. Check Console tab for any Supabase configuration errors
3. If you see "Supabase not configured", you need to update the credentials

## 🚨 Common Issues & Solutions

### Issue: "Supabase not configured" or "Failed to initialize Supabase"
**Solution**: Check your environment variables in Vercel dashboard:
- `SUPABASE_URL` should be your full Supabase project URL
- `SUPABASE_ANON_KEY` should be your anon public key (not service role key)

### Issue: "Authentication failed"
**Solution**: 
- Verify your Supabase project is set up correctly
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel (for backend)
- Ensure `SUPABASE_ANON_KEY` is set in Vercel (for frontend)

### Issue: "Failed to save schedule"
**Solution**: Verify your database schema is set up in Supabase:
1. Go to Supabase SQL Editor
2. Run the schema from `database-schema.sql`
3. Check that RLS policies are enabled

### Issue: Build fails
**Solution**: Check that all dependencies are in `package.json`

## 🔄 Updating Your App

### Automatic Deployments

- Every time you push to your main branch, Vercel will automatically redeploy
- No manual deployment needed

### Manual Updates

1. Make changes to your code
2. Commit and push to GitHub
3. Vercel automatically detects changes and redeploys

## 📱 Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (up to 24 hours)

## 💰 Cost

- **Vercel**: Free tier includes unlimited deployments
- **Supabase**: Free tier includes 500MB database + 2GB storage
- **OpenAI**: Pay per API call (very cheap for this use case)

## 🎉 Success!

Your Schedule Editor is now:
- ✅ Live on the internet
- ✅ Accessible to multiple users
- ✅ Automatically updated on code changes
- ✅ Scalable and production-ready

## 🆘 Need Help?

- Check Vercel deployment logs
- Review Supabase dashboard for database issues
- Check browser console for frontend errors
- Verify all environment variables are set correctly

# Deployment Checklist - Vercel + Railway

## 🚀 Step-by-Step Deployment Guide

Follow these steps exactly to deploy your Nursery Management System online for free!

---

## Part 1: Deploy Backend to Railway (10 minutes)

### Step 1: Create Railway Account

1. Open your browser and go to: **https://railway.app**
2. Click **"Login"** in the top right
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub account
5. ✅ You should now be on the Railway dashboard

### Step 2: Create New Project

1. Click **"New Project"** button (big purple button)
2. Select **"Deploy from GitHub repo"**
3. If prompted, click **"Configure GitHub App"** and grant access to your repositories
4. Select the **"nursy"** repository from the list
5. ✅ Railway will start scanning your repository

### Step 3: Set Up Backend Service

1. Railway should detect the `nursery-system/backend` folder
2. Click on the backend service card
3. Click **"Settings"** tab
4. Under "Root Directory", enter: `nursery-system/backend`
5. Under "Start Command", enter: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Click **"Save"**
7. ✅ Service configured

### Step 4: Add PostgreSQL Database

1. Click **"New"** button in your project
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically create and link the database
5. ✅ Database created and linked

### Step 5: Configure Environment Variables

1. Click on your backend service
2. Click **"Variables"** tab
3. Click **"Add Variable"** and add these one by one:

```
SECRET_KEY = <COPY THIS VALUE BELOW>
```

**Generate SECRET_KEY now:**
Run this in your terminal:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Copy the output and paste as SECRET_KEY value.

**Add more variables:**
```
DEBUG = False
ALLOWED_ORIGINS = *
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

**Note**: We'll update ALLOWED_ORIGINS later with your Vercel URL

4. ✅ Click "Save" after adding each variable

### Step 6: Deploy Backend

1. Railway automatically deploys when you save
2. Wait for deployment to complete (watch the "Deployments" tab)
3. When done, click **"Settings"** tab
4. Find **"Domains"** section
5. Click **"Generate Domain"**
6. ✅ Copy your backend URL (e.g., `https://your-app.railway.app`)

**📝 SAVE THIS URL - YOU'LL NEED IT!**

### Step 7: Initialize Database

1. Click on your backend service
2. Go to **"Settings"** tab
3. Scroll to **"Service"** section
4. Click **"Shell"** or use the Railway CLI
5. Run this command:
```bash
python seed_db.py
```
6. ✅ Database initialized with default data

**Your Backend is now LIVE! 🎉**

Test it: Visit `https://your-railway-url/docs` in your browser

---

## Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Create Vercel Account

1. Open your browser and go to: **https://vercel.com**
2. Click **"Sign Up"** in the top right
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. ✅ You should now be on the Vercel dashboard

### Step 2: Import Project

1. Click **"Add New..."** button (top right)
2. Select **"Project"**
3. Click **"Import"** next to your **"nursy"** repository
   - If you don't see it, click "Adjust GitHub App Permissions" and grant access
4. ✅ Vercel will start analyzing your repository

### Step 3: Configure Build Settings

1. Under **"Configure Project"**, set these values:

   **Framework Preset**: `Vite`

   **Root Directory**: Click "Edit" and select `nursery-system/frontend`

   **Build Command**: `npm run build`

   **Output Directory**: `dist`

   **Install Command**: `npm install`

2. ✅ Configuration set

### Step 4: Add Environment Variables

1. Expand **"Environment Variables"** section
2. Add this variable:

   **Name**: `VITE_API_URL`

   **Value**: `<YOUR RAILWAY BACKEND URL>` (the one you saved earlier)

   Example: `https://your-app.railway.app`

3. ✅ Click "Add" to save

### Step 5: Deploy

1. Click **"Deploy"** button (big blue button at the bottom)
2. Vercel will build and deploy your frontend (takes 2-3 minutes)
3. Watch the build logs
4. When done, you'll see **"Congratulations! 🎉"**
5. ✅ Click "Continue to Dashboard"

### Step 6: Get Your Frontend URL

1. You'll see your deployment
2. Click on the **"Visit"** button or find your URL
3. ✅ Copy your frontend URL (e.g., `https://your-app.vercel.app`)

**📝 SAVE THIS URL!**

**Your Frontend is now LIVE! 🎉**

---

## Part 3: Final Configuration (2 minutes)

### Update Backend CORS Settings

Now that you have your frontend URL, update Railway:

1. Go back to **Railway dashboard**
2. Click on your **backend service**
3. Click **"Variables"** tab
4. Find **"ALLOWED_ORIGINS"** variable
5. Update the value to: `https://your-vercel-app.vercel.app`
   (use your actual Vercel URL)
6. Click **"Save"**
7. ✅ Railway will automatically redeploy

### Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. You should see the login page
3. Try logging in:
   - **Email**: `admin@nursery.com`
   - **Password**: `Admin123!`
4. ✅ If you can log in, everything works!

---

## 🎉 Success! Your App is Live!

### Share these URLs:

**For End Users:**
- 🌐 **Application**: `https://your-app.vercel.app`
- 👤 **Login**: `admin@nursery.com` / `Admin123!`

**For Developers:**
- 🔧 **API**: `https://your-railway-backend.railway.app`
- 📚 **API Docs**: `https://your-railway-backend.railway.app/docs`

---

## 📱 Monitoring & Maintenance

### View Logs

**Backend (Railway)**:
1. Go to Railway dashboard
2. Click on backend service
3. Click "Deployments" tab
4. Click on latest deployment
5. View logs

**Frontend (Vercel)**:
1. Go to Vercel dashboard
2. Click on your project
3. Click "Deployments"
4. Click on latest deployment
5. View "Build Logs" or "Function Logs"

### Auto-Deployments

Good news! Both services auto-deploy when you push to GitHub:
- Push to `main` branch → Automatic deployment to production
- Create a pull request → Vercel creates preview deployment

---

## 🔧 Troubleshooting

### Problem: Can't log in / CORS errors

**Solution**:
1. Check Railway backend logs for errors
2. Verify ALLOWED_ORIGINS in Railway includes your Vercel URL
3. Make sure VITE_API_URL in Vercel matches Railway URL

### Problem: Backend won't start

**Solution**:
1. Check Railway logs
2. Verify all environment variables are set
3. Check DATABASE_URL is automatically set by Railway
4. Try redeploying

### Problem: Frontend shows error connecting to API

**Solution**:
1. Check VITE_API_URL in Vercel environment variables
2. Make sure it matches your Railway backend URL
3. Verify backend is running (visit /docs endpoint)

### Problem: Database not initialized

**Solution**:
1. Go to Railway backend service
2. Open Shell
3. Run: `python seed_db.py`
4. Check logs for any errors

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Database initialized
- [ ] Can access frontend URL
- [ ] Can log in with admin credentials
- [ ] Changed default admin password
- [ ] API docs accessible
- [ ] Shared URLs with team

---

## 🎯 Next Steps

1. **Change Password**: Log in and immediately change the default admin password
2. **Add Users**: Create accounts for your staff and parents
3. **Add Nurseries**: Set up your actual nursery locations
4. **Custom Domain** (optional): Add your own domain in Vercel settings
5. **Monitoring** (optional): Set up error tracking with Sentry

---

## 📞 Need Help?

If you get stuck:
1. Check the troubleshooting section above
2. View deployment logs for error messages
3. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
4. Create an issue on GitHub

---

**Congratulations! Your Nursery Management System is now live and accessible worldwide! 🌍🎉**

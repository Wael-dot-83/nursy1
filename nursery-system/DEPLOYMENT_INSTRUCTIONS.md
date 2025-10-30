# End User Access - Deployment Instructions

## Overview

This guide explains how to make your Nursery Management System accessible to end users via the internet.

## Quick Start - Free Deployment

### Method 1: Vercel + Railway (Recommended - Free Tier Available)

#### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `nursy` repository
   - Select `nursery-system/backend` folder

3. **Configure Environment Variables**
   Click "Variables" and add:
   ```
   SECRET_KEY=<generate-a-long-random-string>
   DATABASE_URL=<railway-will-provide-this>
   ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   ```

4. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway automatically links it to your app

5. **Deploy**
   - Railway automatically deploys
   - Copy your backend URL (e.g., `https://nursy-backend.railway.app`)

6. **Initialize Database**
   - In Railway dashboard, open "Shell"
   - Run: `python seed_db.py`

#### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your `nursy` repository
   - Set "Root Directory" to `nursery-system/frontend`

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Your app will be live at `https://your-app.vercel.app`

6. **Update Backend CORS**
   - Go back to Railway
   - Update `ALLOWED_ORIGINS` with your Vercel URL
   - Redeploy backend

#### Step 3: Access Your Application

Your application is now live!
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.railway.app`
- **API Docs**: `https://your-backend.railway.app/docs`

**Default Login**:
- Email: `admin@nursery.com`
- Password: `Admin123!`

---

### Method 2: Netlify + Heroku (Alternative Free Option)

#### Deploy Backend to Heroku

```bash
# Install Heroku CLI
# Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
# Mac: brew tap heroku/brew && brew install heroku
# Linux: curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Navigate to backend
cd nursery-system/backend

# Create Heroku app
heroku create your-nursery-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key-here
heroku config:set ALLOWED_ORIGINS=https://your-frontend.netlify.app

# Deploy
git push heroku main

# Initialize database
heroku run python seed_db.py

# Get your backend URL
heroku info
```

#### Deploy Frontend to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Navigate to frontend
cd nursery-system/frontend

# Create .env.production
echo "VITE_API_URL=https://your-nursery-backend.herokuapp.com" > .env.production

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

---

### Method 3: DigitalOcean (Simplest Paid Option - $5/month)

#### Using DigitalOcean App Platform

1. **Create Account**
   - Go to https://www.digitalocean.com
   - Sign up and add payment method

2. **Create App**
   - Click "Create" → "Apps"
   - Connect GitHub repository
   - Select `nursy` repository

3. **Configure Services**

   **Backend Service**:
   - Source: `nursery-system/backend`
   - Type: Web Service
   - Run Command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
   - HTTP Port: 8080
   - Environment Variables: Add all from `.env.example`

   **Frontend Service**:
   - Source: `nursery-system/frontend`
   - Type: Static Site
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: `VITE_API_URL=https://your-backend-url`

   **Database**:
   - Add PostgreSQL database (dev tier is free)

4. **Deploy**
   - Click "Create Resources"
   - DigitalOcean handles everything automatically

5. **Get URLs**
   - Backend: `https://nursy-backend-xxxxx.ondigitalocean.app`
   - Frontend: `https://nursy-xxxxx.ondigitalocean.app`

---

### Method 4: Docker + Cloud VM (Most Control)

#### AWS EC2, Google Cloud, or DigitalOcean Droplet

```bash
# After creating your VM and SSH'ing in:

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose

# Clone repository
git clone https://github.com/Wael-dot-83/nursy.git
cd nursy/nursery-system

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Deploy
docker-compose up -d

# Your app is now running on:
# Frontend: http://YOUR_SERVER_IP
# Backend: http://YOUR_SERVER_IP:8000
```

**Set up domain name** (optional):
1. Point your domain to server IP
2. Set up nginx reverse proxy
3. Add SSL with Let's Encrypt (see DEPLOYMENT_GUIDE.md)

---

## Custom Domain Setup

### Add Custom Domain to Vercel

1. Go to Vercel project settings
2. Click "Domains"
3. Add your domain (e.g., `nursery.yourdomain.com`)
4. Update DNS records as shown

### Add Custom Domain to Railway

1. Go to Railway project settings
2. Click "Settings" → "Domains"
3. Add custom domain
4. Update DNS with provided CNAME

---

## Sharing with End Users

Once deployed, share these instructions with users:

### User Access Instructions

```markdown
# Welcome to Nursery Management System

## Access the Application

Visit: https://your-app-domain.com

## First Time Login

Use these credentials:
- **Email**: admin@nursery.com
- **Password**: Admin123!

**IMPORTANT**: Change your password immediately after first login!

## Browser Requirements

- Chrome, Firefox, Safari, or Edge (latest version)
- JavaScript enabled
- Cookies enabled

## Support

For help, contact: support@yourdomain.com
```

---

## Monitoring & Maintenance

### Check Application Health

```bash
# Backend health check
curl https://your-backend-url/

# Should return:
# {"message":"Nursery Management System API","version":"1.0.0"}
```

### View Logs

**Vercel**:
- Go to project → Deployments → Click deployment → View Function Logs

**Railway**:
- Go to project → Click service → View Logs

**Heroku**:
```bash
heroku logs --tail -a your-app-name
```

### Update Application

When you push to GitHub:
- **Vercel & Railway**: Auto-deploy new changes
- **Heroku**: Run `git push heroku main`
- **DigitalOcean**: Auto-deploy from GitHub

---

## Cost Comparison

| Service | Frontend | Backend | Database | Total/Month |
|---------|----------|---------|----------|-------------|
| **Vercel + Railway** | Free | Free | Free | **$0** |
| **Netlify + Heroku** | Free | Free | Free | **$0** |
| **DigitalOcean** | $5 | Included | Free | **$5** |
| **AWS Lightsail** | Included | $3.50 | Included | **$3.50** |
| **Full Cloud (AWS/GCP)** | ~$5 | ~$20 | ~$15 | **$40+** |

**Recommendation**: Start with Vercel + Railway (free), upgrade as needed.

---

## Security Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Set strong `SECRET_KEY` in environment
- [ ] Configure CORS with specific origins (not *)
- [ ] Enable HTTPS (automatic with most platforms)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Review user permissions
- [ ] Test all authentication flows

---

## Troubleshooting

### Frontend loads but can't connect to backend

**Solution**: Check CORS configuration
```python
# In backend, verify ALLOWED_ORIGINS includes frontend URL
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
```

### Database connection errors

**Solution**: Verify DATABASE_URL environment variable
- For Railway/Heroku: Should be auto-configured
- Check it's properly set in environment variables

### 404 errors on page refresh

**Solution**: Configure SPA routing
- Vercel: Automatically handled
- Netlify: Add `_redirects` file:
  ```
  /*    /index.html   200
  ```

---

## Need Help?

- **Documentation**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues**: Create an issue on GitHub
- **Email**: support@yourdomain.com

---

## Next Steps

After deployment:

1. ✅ Change default admin password
2. ✅ Add your nurseries
3. ✅ Create user accounts
4. ✅ Configure email/SMS notifications (optional)
5. ✅ Set up regular backups
6. ✅ Add custom domain (optional)
7. ✅ Configure monitoring (optional)

Your Nursery Management System is now live and accessible to users worldwide! 🎉

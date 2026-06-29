# Deploying PrimeX CRM to Vercel

## Prerequisites
- GitHub account with push access to `Raj-3200/primex-crm`
- [Vercel account](https://vercel.com) (free tier works)
- Neon database already set up

---

## Method 1: Vercel Dashboard (Recommended)

### Step 1: Import the repository
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select `Raj-3200/primex-crm`
4. Click **Import**

### Step 2: Configure project settings
| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

### Step 3: Add Environment Variables
Click **"Environment Variables"** and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_R2ABjSL4EfPT@ep-royal-sun-adbm2icx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `primex-crm-secret-key-2024-neon-production` |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` (update after first deploy) |

### Step 4: Deploy
Click **"Deploy"** — Vercel will build and deploy automatically.

---

## Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel --prod
```

---

## Method 3: GitHub Actions Auto-Deploy

Add these secrets to your GitHub repo (`Settings > Secrets > Actions`):

| Secret | How to get |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Run `vercel whoami` |
| `VERCEL_PROJECT_ID` | Found in `.vercel/project.json` after first deploy |
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | Same as your .env.local |

Then every push to `master` automatically deploys to production.

---

## After Deployment

### Update the app URL
Once deployed, update `NEXT_PUBLIC_APP_URL` in Vercel environment variables to your actual URL (e.g., `https://primex-crm.vercel.app`).

### Verify everything works
1. Visit your Vercel URL
2. Login with `admin@primex.com` / `Admin@123`
3. Check dashboard shows real data
4. Test creating a customer and order

---

## Neon Database (Already Set Up)

The database is hosted on Neon at:
- **Region:** US East (AWS)
- **Database:** `neondb`
- **Connection Pooling:** Enabled

If you need to reseed the database:
```bash
cd frontend
node seed.js
```

---

## Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project → **Settings → Domains**
2. Add your domain (e.g., `crm.primexservices.com`)
3. Update your DNS with the provided CNAME record
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

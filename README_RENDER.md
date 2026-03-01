# Deploying Puppy Cam Co to Render

Follow these steps to host your website on Render:

## 1. Create a GitHub/GitLab Repository
- Initialize a git repository in your project folder:
  ```bash
  git init
  git add .
  git commit -m "Initial commit for hosting"
  ```
- Push your code to a new repository on GitHub or GitLab.

## 2. Connect to Render
- Create a new **Web Service** on [Render](https://dashboard.render.com/).
- Select your repository.

## 3. Configure Service Settings
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free` (or higher)

## 4. Set Environment Variables
In the **Environment** tab of your Render service, add the following variables:
- `SESSION_SECRET`: A long random string of your choice (e.g., `your-secret-key-123`).
- `NODE_ENV`: `production`

## 5. Important: SQLite Database Tracking
> [!IMPORTANT]
> Because you are using the **Render Free Tier**, persistent disks are not supported.
> 
> **What this means for your site:**
> - Any data added while the site is live (e.g., new pets added via admin, new users registered) will be **deleted** whenever the server restarts or you redeploy.
> - The site will always reset back to the "clean" state of your code.
> 
> **How to handle this:**
> - If you want your changes to stay permanent, you must upgrade to Render's **Starter** plan (which supports Disks).
> - For the free tier, treat the site as a live demo rather than a permanent store.

## 6. Deployment
Click **Create Web Service** and wait for the build to finish. Your site will be live at `https://your-app-name.onrender.com`.

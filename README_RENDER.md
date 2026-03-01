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

## 5. Important: SQLite Database
> [!WARNING]
> By default, Render's file system is ephemeral. Any data added to the SQLite database (new pets, users, etc.) will be **lost** every time the server restarts or you redeploy.

### Solutions:
1. **Persistent Disk (Recommended)**:
   - Add a "Disk" to your service in Render settings.
   - Mount it at `/data`.
   - Update `server.js` to point the database to `/data/database.sqlite`.
2. **External Database**:
   - Use a managed PostgreSQL database (Render offers a free tier) and update the code to use `pg` instead of `better-sqlite3`.

## 6. Deployment
Click **Create Web Service** and wait for the build to finish. Your site will be live at `https://your-app-name.onrender.com`.

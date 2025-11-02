# Deployment Guide: Vercel (Frontend) & Render (Backend)

This guide provides step-by-step instructions for deploying your full-stack application.

- The **React Frontend** will be deployed to **Vercel** for optimal performance and a global CDN.
- The **Express Backend** will be deployed to **Render** as a web service.

---

## Part A: Deploying the Backend to Render

First, we'll deploy the Express.js API server.

### Step 1: Prepare Your Repository

Ensure your latest code is pushed to your GitHub/GitLab repository.

### Step 2: Sign Up and Create a New Web Service on Render

1.  Create an account on [Render.com](https://render.com/) and connect your Git account.
2.  On your dashboard, click **New +** > **Web Service**.
3.  Select your project's repository.

### Step 3: Configure the Backend Service

Render will ask for the service details. Fill them in as follows:

-   **Name**: Give your service a unique name (e.g., `karunasetu-api`).
-   **Root Directory**: `backend` (This tells Render to run commands from within the `backend` folder).
-   **Environment**: `Node`.
-   **Region**: Choose a region closest to you or your users.
-   **Branch**: `main` (or your primary branch).
-   **Build Command**: `pnpm install && pnpm build`.
-   **Start Command**: `pnpm start`.

### Step 4: Add Environment Variables

This is the most critical step for your backend. Go to the **Environment** tab for your new service and add the following environment variables. These should match the values from your local `.env` file.

**Do not commit your `.env` file. Add these secrets directly in the Render UI.**

```
Key: MONGODB_URI
Value: your_mongodb_atlas_connection_string

Key: MONGODB_DB
Value: your_database_name

Key: ADMIN_EMAIL
Value: your_admin_login_email

Key: ADMIN_PASSWORD
Value: your_secure_admin_password

Key: ADMIN_JWT_SECRET
Value: a_long_random_secret_string_for_jwt

Key: CLOUDINARY_CLOUD_NAME
Value: your_cloudinary_cloud_name

Key: CLOUDINARY_API_KEY
Value: your_cloudinary_api_key

Key: CLOUDINARY_API_SECRET
Value: your_cloudinary_api_secret
```

### Step 5: Deploy

1.  Click **Create Web Service**.
2.  Render will begin building and deploying your backend. You can watch the logs in the "Logs" tab.
3.  Once the deployment is successful, your API will be live. Render will provide you with a public URL, which is `https://karunaapi.onrender.com`.

**➡️ Your backend URL is `https://karunaapi.onrender.com`. You will need this for the frontend deployment.**

---

## Part B: Deploying the Frontend to Vercel

Now, let's deploy the React frontend.

### Step 1: Sign Up and Create a New Project on Vercel

1.  Create an account on Vercel.com and connect your Git account.
2.  On your dashboard, click **Add New...** > **Project**.
3.  Select your project's repository.

### Step 2: Configure the Frontend Project

Vercel is excellent at auto-detecting Vite projects. It will likely pre-fill most of these settings, but you should verify them.

1.  Expand the **Root Directory** section and select the `frontend` folder.

2.  Vercel should automatically detect the **Framework Preset** as `Vite`. The build settings will be configured for you. They should look like this:
    -   **Build Command**: `pnpm build`
    -   **Output Directory**: `dist`
    -   **Install Command**: `pnpm install`

### Step 3: Add the Backend API URL as an Environment Variable

This step tells your frontend where to send API requests in production.

1.  Expand the **Environment Variables** section.
2.  Add a new variable:
    -   **Name**: `VITE_API_BASE_URL`
    -   **Value**: `https://karunaapi.onrender.com`

### Step 4: Deploy

1.  Click the **Deploy** button.
2.  Vercel will build and deploy your frontend.
3.  Once complete, you'll be given a public URL for your live website!

---

## Part C: Final Configuration (CORS)

Your backend needs to allow requests from your frontend's domain.

1.  Go to your backend code (`backend/src/index.ts` or wherever you configure CORS).
2.  Ensure your CORS configuration allows your Vercel frontend's domain.

    **Example `cors` configuration in Express:**

    ```typescript
    import cors from 'cors';

    const app = express();

    const allowedOrigins = [
      'http://localhost:8080', // Your local dev frontend
      'https://karuna-setu-foundation.vercel.app' // Your production frontend URL
    ];

    app.use(cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));
    ```

3.  Commit and push this change. Render will automatically redeploy your backend with the updated CORS policy.

## 🎉 Congratulations!

Your full-stack application is now live!

-   **Frontend**: Served globally by Vercel.
-   **Backend**: Running on Render.

Both services are connected to your Git repository and will automatically redeploy whenever you push new changes to your main branch.
# Somudai

Full-stack social app with:
- **Backend:** Node.js + Express + MongoDB + Socket.IO
- **Frontend:** React + Vite

## 1) Run locally

### Prerequisites
- Node.js 18+
- MongoDB connection string (Atlas or local)
- Cloudinary account (for image uploads)
- Google OAuth credentials (optional, for Google login)

### Install dependencies
```bash
npm install
npm install --prefix frontend
```

### Environment variables
Create `backend/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret
ADMIN_EMAIL=admin@example.com

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Start app
Terminal 1:
```bash
node backend/index.js
```

Terminal 2:
```bash
npm run dev --prefix frontend
```

## 2) Production deployment (beginner-friendly)

A simple setup:
- Deploy backend on **Render/Railway**
- Deploy frontend on **Vercel/Netlify**
- Use **MongoDB Atlas** for database

### Backend deploy checklist
1. Push repo to GitHub.
2. Create a new Web Service (Render/Railway) from repo.
3. Set start command:
   ```bash
   node backend/index.js
   ```
4. Add all `backend/.env` variables in the platform dashboard.
5. Set `CLIENT_URL` to your deployed frontend URL.
6. After deployment, copy backend URL, e.g. `https://your-api.onrender.com`.

### Frontend deploy checklist
1. Import repo to Vercel/Netlify.
2. Set frontend build command:
   ```bash
   npm run build --prefix frontend
   ```
3. Set publish directory:
   ```
   frontend/dist
   ```
4. Add env var:
   ```env
   VITE_API_URL=https://your-api.onrender.com/api/v1
   ```
5. Redeploy frontend.

### Google OAuth setup for production
In Google Cloud Console, set:
- Authorized JavaScript origins: your frontend URL
- Authorized redirect URI:
  `https://your-api.onrender.com/api/v1/auth/google/callback`

## 3) Useful scripts
- Build frontend: `npm run build`
- Start backend: `npm start`
- Lint frontend: `npm run lint --prefix frontend`

---
If you want, next I can also generate a **one-click deployment plan** specifically for either **Render + Vercel** or **Railway + Netlify**.

# Dailyvy Admin

The admin panel for Dailyvy (React 19, Vite, shadcn/ui). Talks to the Dailyvy API at `/api/v1/admin`.

- **Login:** email + password, then a 6-digit code sent by email
- **Access requests:** approve (creates the account and emails a temporary password) or reject
- **Users:** list, send a new temporary password, remove an account
- **Change password**

## First admin

Admins are separate from app users. Create one from the server folder (uses its `.env`):

```bash
npm run admin:create -- you@example.com "Your Name"
```

It prints a temporary password once. Log in and change it right away. Running it again for the same email replaces a forgotten password.

## Run

```bash
npm install
npm run dev        # http://localhost:5175 — the API on :4000 via the Vite proxy
```

## Build for GitHub Pages

```bash
VITE_BASE=/dailyvy-admin/ VITE_API_BASE_URL=https://<your-api>.onrender.com/api/v1 npm run build
```

The API must allow this site's origin (`CLIENT_ORIGIN` on the server, comma-separated).

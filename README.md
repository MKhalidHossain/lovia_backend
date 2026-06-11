# Lovia Backend

Node/Express + MongoDB auth API for the Lovia Flutter app (`../lovia`).
Provides email/password, Google, Facebook, and guest sign-in with JWT
access/refresh tokens, an OTP-based password reset flow, and user profile
endpoints.

## Stack

- **Express 5** (CommonJS) · **Mongoose** (MongoDB)
- **jsonwebtoken** — short-lived access tokens + long-lived refresh tokens with
  server-side invalidation via a per-user `tokenVersion`
- **bcryptjs** — password hashing
- **nodemailer** — OTP emails for password reset
- Social token verification via Google `tokeninfo` / Facebook Graph API
  (Node 18+ global `fetch`, no extra dependency)

## Setup

```bash
npm install
cp .env.example .env   # then fill in your own values
npm run dev            # nodemon, listens on PORT (default 3000)
```

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | HTTP port (default `3000`) |
| `JWT_SECRET` | Signs access tokens |
| `JWT_REFRESH_SECRET` | Signs refresh tokens |
| `ACCESS_TOKEN_TTL` | e.g. `15m` |
| `REFRESH_TOKEN_TTL` | e.g. `30d` |
| `GOOGLE_WEB_CLIENT_ID` | OAuth web client id used to verify Google ID tokens |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP credentials for OTP reset emails |

## API

All sign-in endpoints return the same envelope:
`{ accessToken, refreshToken, user }` where
`user = { id, name, email, avatarUrl, coins, isGuest, language }`.

| Action | Method & Path | Auth |
|---|---|---|
| Register | `POST /auth/register` | — |
| Login | `POST /auth/login` | — |
| Google sign-in | `POST /auth/google` | — |
| Facebook sign-in | `POST /auth/facebook` | — |
| Guest sign-in | `POST /auth/guest` | — |
| Refresh tokens | `POST /auth/refresh` | — |
| Logout | `POST /auth/logout` | Bearer |
| Forgot password | `POST /auth/forgot-password` | — |
| Verify OTP | `POST /auth/verify-otp` | — |
| Reset password | `POST /auth/reset-password` | — |
| Get profile | `GET /users/me` | Bearer |
| Update profile | `PATCH /users/me` | Bearer |
| Health check | `GET /health` | — |

Full request/response shapes are documented in the Lovia app README
(`../lovia/README.md`, "Auth contract" section).

## Project structure

```
server.js          # app entry: routes mounted at /auth and /users
config/db.js       # Mongoose connection
routes/            # auth.js, users.js
controllers/       # authController.js, usersController.js
middleware/auth.js # Bearer-token guard (verifies access token)
models/User.js     # provider, social ids, coins, language, tokenVersion…
utils/             # tokens.js, socialVerify.js, sendEmail.js
```

## Notes

- Logout and password reset bump the user's `tokenVersion`, invalidating all
  outstanding refresh tokens server-side.
- The OTP for password reset is emailed **and** printed to the server console
  for local testing.

# Bildy API

A REST API built with Node.js and Express for user and company management. Implements a complete authentication flow, data validation and role-based access control.

![Node.js](https://img.shields.io/badge/Node.js-22+-339933)
![Express](https://img.shields.io/badge/Express-5-000000)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248)

## Tech Stack

- **Runtime:** Node.js 22+
- **Framework:** Express 5
- **Database:** MongoDB + Mongoose
- **Validation:** Zod
- **Auth:** JWT + bcryptjs
- **File uploads:** Multer
- **Security:** Helmet

## How to Run

1. Clone the repo and install dependencies:

        git clone https://github.com/Vaibs16/bildy-api.git
        cd bildy-api
        npm install

2. Set up environment variables:

        cp .env.example .env

   Fill in `PORT`, `MONGO_URL` and `JWT_SECRET` in the `.env` file.

3. Start the server:

        npm run dev    # development (auto-restart on changes)
        npm start      # production

## API Endpoints

**Registration and Validation**
- `POST /api/user/register` : Creates a user with admin role. Validates email and password (min. 8 chars) with Zod. Hashes password with bcryptjs and generates a 6-digit verification code.
- `PUT /api/user/validation` . Validates the 6-digit code. Maximum 3 attempts before blocking (429).
- `POST /api/user/login` : Authenticates the user and returns profile data with access and refresh tokens.

**Onboarding**
- `PUT /api/user/register` : Requires JWT. Updates personal data (name, surname, NIF).
- `PATCH /api/user/company` : Requires JWT. Links user to a company via CIF. If CIF does not exist, creates the company (user becomes owner/admin). If it exists, user joins as guest. Supports freelance logic (`isFreelance: true`).
- `PATCH /api/user/logo` : Requires JWT and associated company. Uploads a logo via Multer (5MB limit).

**Profile and Session**
- `GET /api/user` : Requires JWT. Returns full user profile including company data via populate and virtual `fullName` field.
- `POST /api/user/refresh` : Receives a refresh token and generates a new access token.
- `POST /api/user/logout` : Requires JWT. Invalidates the session.

**Administration and Security**
- `DELETE /api/user` : Requires JWT. Supports soft delete via `?soft=true`.
- `PUT /api/user/password` : Requires JWT. Changes password validating the current one. Uses Zod `.refine()` to ensure the new password differs from the old one.
- `POST /api/user/invite` : Admin only. Creates a guest user linked to the same company and fires a `user:invited` event via EventEmitter.

## Testing with api.http

The `api.http` file is configured with variables that capture tokens automatically.

1. Run request `1. Register` : token saved to `{{registro_token}}`. The 6-digit code prints in the server console.
2. Paste the code into request `2. Validation`.
3. Run request `3. Login` : updates `{{login_token}}` and `{{refresh_token}}` automatically.
4. All subsequent requests (onboarding, profile, logout, etc.) can be run without manually copying tokens.

If you get a `401 Unauthorized`, re-run the Login request to refresh the variables.

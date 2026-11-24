# SIT313 P2 – DEV@Deakin Welcome Email

A small Express application that accepts an email subscription and sends a welcome email through SendGrid.

## Requirements

- Node.js 18 or later
- A SendGrid account and API key
- A sender email address verified in SendGrid

## Setup

1. Open this folder in VS Code.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`.
4. Add your SendGrid API key and verified sender email to `.env`:

   ```env
   SENDGRID_API_KEY=your_real_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email@example.com
   PORT=3000
   ```

   Do not commit `.env` or share your API key. The `.gitignore` file excludes it from Git.

## Run

```bash
npm start
```

Open http://localhost:3000 and submit a valid email address.

## Expected server output

For each valid form submission, the server adds an entry to the in-memory `subscribers` array. Each entry records the email address, delivery status (`pending`, `sent`, or `failed`), SendGrid status code when available, and submission timestamp. The terminal logs this array on both successful and failed SendGrid requests. A successful SendGrid request normally returns HTTP `202 Accepted`.

The array is stored in memory and is cleared whenever the server restarts. It is not a permanent database. A failed email request is recorded as `failed`; it is not reported as a successful subscription.

## Useful endpoint

- `GET /health` – reports whether SendGrid environment variables are configured and how many subscribers are in memory.
- `POST /subscribe` – validates the email, sends the welcome message and records the email after successful acceptance by SendGrid.

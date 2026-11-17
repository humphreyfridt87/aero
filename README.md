# AERO Inflatable Concepts — Vercel Production Package

One-page English AERO website. Same existing navy/pink/purple design, responsive layout, AI concept imagery, partner presentation and contact links. No lead database.

## Hosting
1. Create a GitHub repository with the **contents of this folder at the repository root** (not an extra nested folder).
2. Import into Vercel. Choose Framework Preset **Other** and no build command. `index.html` is in the root; Vercel serves assets from `public/assets`.
3. Set the environment variables listed below in Vercel Project Settings → Environment Variables, then redeploy.
4. Test the live site on desktop and mobile. Submit a real test lead, confirm that the success message appears and that the message arrives at `humphrey@growthartistmgmt.com`.

## Required services and environment variables

**Resend** (https://resend.com): verify a domain you control and create an API key. Set:
- `RESEND_API_KEY`: secret API key
- `CONTACT_FROM_EMAIL`: verified sender address, for example `AERO <hello@yourdomain.com>`. The receiver is fixed to `humphrey@growthartistmgmt.com`; the visitor's address is set as Reply-To.

**Cloudflare Turnstile** (https://dash.cloudflare.com): create a widget, add your production hostname and Vercel preview hostname(s) as appropriate. Set:
- `TURNSTILE_SITE_KEY`: public site key
- `TURNSTILE_SECRET_KEY`: secret verification key
- `ALLOWED_HOSTNAME` (optional): your production hostname, without protocol. Do not set this for multi-host previews unless you have adapted the validation.

**Upstash Redis** (https://upstash.com): create a Redis database with REST API enabled. This is used **only for rate limiting**, not lead storage. Set:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The form deliberately fails closed when these services are missing or unavailable. It does not falsely claim to have sent a lead. Contact mail, phone and WhatsApp links remain usable.

## Form behavior
- Lead types: Free brainstorm session / Request a quote
- Fields: name, organization, email, project type, event date, message
- Protection: Cloudflare Turnstile server verification, hidden honeypot, server-side validation, maximum field lengths and IP rate limit (5 requests/hour/IP)
- After successful Resend API response, a success message is shown. This confirms provider acceptance, **not inbox delivery**. Verify Resend logs and mailbox receipt.
- No lead database or contact record is created by AERO. Resend may retain transactional email logs under its own retention policy; Upstash stores short-lived rate-limit counters keyed by IP. Review privacy and processor agreements before launch.

## Quality assurance before launch
- Verify sender domain and SPF/DKIM records per Resend instructions.
- Test a valid inquiry for both lead types and verify receipt and reply-to.
- Test invalid email, incomplete fields, failed captcha, 6th submission within one hour, unavailable provider and mobile layout.
- Confirm permitted usage rights for concept images and partner logo.
- Add a proper privacy notice and company details before promoting the website.
- Optional: add analytics with consent management where legally required.

## Editing with Claude
Upload this ZIP and ask Claude to modify `index.html`, `api/contact.js` and assets without changing the chosen visual identity. Never paste live secrets into HTML or into a public repository.

## Contact
humphrey@growthartistmgmt.com · +31 85 060 3984 (telephone and WhatsApp)

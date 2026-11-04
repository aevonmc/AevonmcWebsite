# AevonMC — GitHub Pages website

A cartoon sky-and-cloud themed public Rules & Guides website. No database, Vercel, Supabase, or external backend is required. Fonts are loaded from Google Fonts when available, with local system fallbacks.

## Deploy on GitHub

1. Create a **public** GitHub repository (GitHub Pages availability depends on plan/repository visibility).
2. Upload **all files and the assets folder** from this package to the repository root, preserving filenames.
3. Open repository **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose **main** and **/(root)**, then save.
5. Wait for GitHub Pages to publish the site. The URL will appear in Pages settings.

## Add / edit / delete posts

Open `posts.json` in GitHub, click the pencil icon, make changes, and **Commit changes**. To add a post, duplicate an existing object and change its fields. To delete, remove its object. The site automatically reads the updated JSON when published.

Fields:
- `title`: visible heading
- `slug`: URL-safe unique ID, e.g. `server-chat-rules` (unique within each category)
- `category`: exactly `rules` or `guides`
- `description`: card preview
- `published`: `true` to show publicly, `false` to hide from the website
- `content`: Markdown text; use `\n` for line breaks inside the JSON string

**Important:** This is a static website. `published: false` hides a post from the interface, but the raw JSON is public. Do not store confidential drafts, secrets, passwords, or private information in `posts.json`. GitHub repository collaborators with write access are your administrators. There is **no custom admin password login** (GitHub Pages cannot securely implement one without a backend).

## Customize

- Logo: `assets/aevonmc-icon.png` (transparent background processed from your uploaded 64×64 icon; for best quality, replace it with a larger transparent original later).
- Colors, clouds, animations: `styles.css`
- Navigation and post rendering: `app.js`
- Site text and HTML: `index.html`

## Security and accessibility

- All user-authored post text is HTML-escaped before Markdown formatting. Raw HTML is not enabled.
- Links in posts only render for explicit `https://` or `http://` URLs, and open with `noopener noreferrer`.
- Reduced-motion system preference disables cloud animations.
- Never put admin credentials or GitHub personal access tokens in this repository.


## Website admin editor (GitHub-only)

Visit `admin.html` from your published website. Create a GitHub fine-grained personal access token scoped **only** to this repository with **Contents: Read and write** permission. Enter `owner/repository`, the branch (`main`), and the token in the admin editor. The editor loads `posts.json` and commits additions, edits and deletions directly via GitHub's API. GitHub Pages updates after the commit is deployed.

**Security:** This is NOT a custom username/password login. GitHub Pages cannot safely validate a password by itself. The access token is held in page memory only (not localStorage), cleared on disconnect/refresh, and sent only to `api.github.com` via HTTPS. Anyone who possesses a token with write access can edit content; keep it private, use a short expiration, and revoke it if exposed. The editor page is public but only authorized GitHub credentials can save changes. Public `posts.json` is readable, including unpublished drafts. Do not put secrets in posts.

**Theme:** `assets/realistic-clouds.webp` is a locally bundled, procedural atmospheric cloud background. Moving cloud overlays and falling cloud particles remain enabled. The AevonMC wordmark uses rounded bubble-style Fredoka lettering.

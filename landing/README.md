# Curate landing

Static coming-soon site. No Node, Mongo, or env vars.

## Preview locally

Open `index.html` in a browser, or from this folder:

```bash
npx serve .
```

## Deploy on Vercel

1. Import the Curate repo (or this folder) in Vercel.
2. Set **Root Directory** to `landing`.
3. Framework Preset: **Other**.
4. Leave **Build Command** and **Output Directory** empty.
5. Deploy.

Or from this folder:

```bash
npx vercel
```

Do not set a start command like `node index.js`. This folder is HTML, CSS, JS, and the logo only.

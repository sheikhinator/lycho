# LYCHO – Zero‑Cost Sustainable Stack

A **completely free** full‑stack starter built with:

- **Supabase** – PostgreSQL, Realtime DB, Auth, and 1 GB storage (free tier)  
- **Next.js** – Static‑site rendering, deployed to **GitHub Pages** (free)  
- **Supabase Functions** – Edge‑run serverless logic (1 M requests/mo free)  
- **UptimeRobot** – Ping monitor (free tier)  

No credit‑card required, no paid hosting, and all open‑source components.

---

## 📁 Repository Structure

```
LYCHO/
├─ lib/                # Supabase client wrapper, DB helpers
├─ pages/              # Next.js pages & API routes
├─ .env.local          # Local env vars (not committed)
├─ .gitignore
├─ package.json
└─ README.md
```

---

## 🚀 Quick Start

1. **Clone the repo**  

   ```bash
   git clone https://github.com/<your‑username>/lycho.git
   cd lycho
   ```

2. **Install dependencies**  

   ```bash
   npm install
   ```

3. **Add Supabase credentials** – create a free project at <https://supabase.com/> and copy:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   then create `.env.local` at the repo root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run a compile‑check** (ensures zero TypeScript errors)

   ```bash
   npx tsc --noEmit
   ```

5. **Build the static site**  

   ```bash
   npm run export   # runs `next build && next export`
   ```

6. **Deploy to GitHub Pages**  

   ```bash
   npm run deploy   # pushes the generated `out/` folder to GitHub
   ```

   After a few seconds GitHub will serve your site at  
   `https://<your‑username>.github.io/lycho`.

7. **(Optional) Keep‑alive function** – prevents Supabase from sleeping:

   ```bash
   # Create and schedule a ping function (requires Supabase CLI)
   supabase functions new keep-alive
   # Edit supabase/functions/keep-alive/index.ts → trivial handler
   supabase login
   supabase functions deploy keep-alive
   # In Supabase Dashboard → Functions → Scheduled Triggers → add trigger:
   #   Cron: */10 * * * *  (runs every 10 min)
   ```

8. **Monitor availability** – sign up at <https://uptimerobot.com/> and add an HTTP monitor for your GitHub Pages URL.

---

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts Next.js dev server on `localhost:3000` (useful for local testing). |
| `npm run lint` | Linting (if added). |
| `npm test` | Run any unit tests (currently none). |

---

## 📚 Project Highlights

- **Authentication** – Supabase Auth with email/password demo (`demo@example.com` / `demo1234`).  
- **Database** – All tables live in Supabase; use the SQL Editor to add migrations (e.g., `CREATE TABLE profiles …`).  
- **Serverless logic** – Supabase Functions (`keep-alive`) run on the Edge; you can add more (`/api/*`).  
- **Zero cost** – All free tiers have generous limits for prototyping or low‑traffic apps.  
- **Static export** – No server costs; the site is pure static HTML/CSS/JS hosted on GitHub Pages.

---

## 🤝 Contributing

1. Fork the repository.  
2. Create a feature branch (`git checkout -b feat/your‑feature`).  
3. Commit your changes with clear messages.  
4. Open a Pull Request.

Please keep the dependency footprint minimal to stay within free limits.

---

## 📄 License

MIT © <Your Name / Organization>

---

## 🙋‍♀️ Need Help?

- **Supabase docs:** <https://supabase.com/docs>  
- **Next.js docs:** <https://nextjs.org/docs>  
- **GitHub Pages:** <https://pages.github.com/>  
- **UptimeRobot:** <https://uptimerobot.com>

Feel free to open an issue if anything is unclear.

--- 

*Generated with ❤️ using only free, open‑source tools.*
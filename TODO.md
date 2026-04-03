# TODO

## Pending Features

- [ ] **Local CSS/JS resolution** — Load CSS and JS files referenced via local paths (`/css/app.css`, `asset()`, `@vite()`) from the workspace's `public/`, `resources/`, `node_modules/`, and `public/build/` directories. Requires reliable workspace folder detection and webview `localResourceRoots` configuration.

- [ ] **Tailwind CSS preview** — Detect Tailwind utility classes in Blade templates and render them in the preview. Options: bundle a Tailwind CDN play script, or integrate with the project's Tailwind build output.

# notebook

A Hugo site (theme: [PaperMod](https://github.com/adityatelange/hugo-PaperMod)) for casual, no-schedule writing on philosophy, religion, physics, educational psychology, and whatever else comes up.

## Writing a new post

```bash
hugo new posts/my-post-title.md
```

This creates a file in `content/posts/` pre-filled with front matter (`title`, `date`, `tags`, `draft: true`). Write in Markdown, then set `draft: false` when you're ready to publish it. Set `math: true` in the front matter if the post has LaTeX equations (`$...$` or `$$...$$`).

Commit and push to `main` — GitHub Actions builds and deploys automatically. Nothing else to do.

## Local preview

```bash
hugo server -D
```

Then open http://localhost:1313. The `-D` flag also shows draft posts locally (they won't appear once deployed unless `draft: false`).

## One-time setup

See the setup instructions provided separately, or:

1. Push this repo to `github.com/<your-username>/notebook` (or any repo name).
2. In the repo settings, go to **Pages** → set **Source** to **GitHub Actions**.
3. Edit `hugo.toml`: replace `YOUR-GITHUB-USERNAME` in `baseURL` and the GitHub social icon URL.
4. Push to `main` — the site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

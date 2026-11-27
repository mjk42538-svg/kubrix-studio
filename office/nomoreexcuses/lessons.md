# Lessons
- 2026-11-27: The work/overtime Short (V-pQaA0qqac) got debate comments (Europe vs US, "wealth is exploitation") — a slightly provocative work/money claim drives comments; keep one arguable claim per script.
- 2026-11-27: Windsor upload_video can fail with "YouTube rate-limited the upload" while other actions work. Retry at most twice with a few minutes between, then report; never assume it went through (can't verify private uploads on the trial plan).
- 2026-11-27: Production note: a pycairo renderer (episode code/render.py) renders 60 s at 1080x1920 in ~25 s — reuse it as the template instead of installing Remotion.
- 2026-11-27: Upload hosting: don't force-push an orphan uploads branch (another channel's run replaced it and the link 404'd). Fetch the branch, add the file, push normally, and give Windsor the commit-pinned raw URL (the branch URL is cached for minutes).

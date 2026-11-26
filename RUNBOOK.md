# Kubrix Studio — daily runbook (read fully before acting)

Three YouTube channels, one Short per channel per day, all published at **21:00 Europe/Madrid**
(= 20:00 UTC in winter; 3 pm US Eastern). The user approved daily auto-publishing in writing (26 Nov 2026).

| Channel | Windsor account | Language / audience | Format |
|---|---|---|---|
| Kubrix (@mjk-m2m) | youtube `123744` | English, US kids/teens | Roblox-style 3D story series (this repo's engine) |
| NOMOREEXCUSES | youtube `126748` | English, US/UK | motivational Short (skill `viral-stickman-video-ingles`) |
| TrazoMental | youtube `126750` | Spanish, Spain | motivational Short (skill `viral-stickman-video-es`) |

## 0. Setup (every run starts in a fresh workspace)
1. Attach and clone the repo: `add_repo` owner `mjk42538-svg`, repo `kubrix-studio`, access `push`; then
   `git clone --depth 1 https://github.com/mjk42538-svg/kubrix-studio /home/claude/kubrix-studio`
2. `ln -sfn /home/claude/kubrix-studio/shorts ~/shorts`
3. `cd ~/shorts/bear && npm i three@0.160.0 playwright-core @fontsource/luckiest-guy` (then `for p in ~/shorts/*/; do ln -sfn ~/shorts/bear/node_modules $p/node_modules; done`)
4. `pip install --break-system-packages -q numpy pillow fonttools brotli`
5. Chrome must exist at `/usr/bin/google-chrome` (used by render.mjs).

## 1. Before making anything
- Read `office/<channel>/channel.md`, `lessons.md`, the last lines of `used.md`, `stats/log.md`.
- **Credits:** call ElevenLabs `account_get_usage`. Each Short costs ~1,200–1,400 credits.
  If fewer than 1,500 remain: do NOT use ElevenLabs. Switch to the FREE fallback (section 2b) and keep producing; mention it in the summary.
  Never call creative_generate_speech twice for the same line (each call charges).
- Retention: pull yesterday's numbers with Windsor `get_data` (youtube, the channel's account) and log them; write 1–3 lessons when the data supports them.

## 2. Voice (ElevenLabs connector)
- `creative_generate_speech`, model `eleven_v4` (supports [tags]), `generations_count: 1`.
- Voices: Kubrix + TrazoMental → **Salva** `hyKxCTlAqtnW188CgltM` (Kubrix in English, TrazoMental in Spanish).
  NOMOREEXCUSES → the voice saved in `office/nomoreexcuses/channel.md` (if empty: pick a deep, intense English motivational voice with `creative_list_voices`, save its id there, and always reuse it).
- Wait ~30 s, then `creative_get_generations` → `full_res_url` → `curl -sL -o audio/voice.mp3 "<url>"`.
  Needs the domain `elevenlabsusercontent.com` allowed (Settings → Capabilities). If curl gets 403: tell the user that domain must be allowed, and stop.
- Scripts: 60–75 s (≈1,100–1,300 characters). Line 1 = the strangest moment. Joke/beat every 3–5 s. End with a cliffhanger / "Part N+1. Follow so you don't miss it." (Kubrix) or a strong loop line (motivational).

## 2b. Free voice fallback (when ElevenLabs credits run out; the user approved this)
The user finds flat TTS too robotic, so pick the most EXPRESSIVE free option that works here:
1. Check `office/voice_fallback.md` first: if a previous run already chose and tested an engine, reuse it (same voice every day per channel).
2. Otherwise web-search for the best current free, open-source, expressive TTS whose license allows commercial use (e.g. Chatterbox (MIT, emotion control), Kokoro (Apache-2.0), or newer ones). Only use packages from pip/npm/GitHub releases; never run unknown installers or anything that asks for account credentials.
   Model weights hosted on huggingface.co need that domain allowed in Settings → Capabilities; if the download is refused, use an engine whose files come from GitHub releases (Kokoro works: `pip install kokoro-onnx soundfile` + `kokoro-v1.0.int8.onnx` and `voices-v1.0.bin` from github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/; English voices am_puck/am_echo/am_michael/am_fenrir, Spanish em_alex/em_santa).
3. Make it as expressive as possible: generate line by line, vary speed per line (faster for excitement, slower for drama), insert real pauses, and pick the most energetic voice.
4. Write what you chose (engine, voice per channel, settings, license) to `office/voice_fallback.md` and commit it, and tell the user in the summary that a free voice was used and which.

## 3. Kubrix episode (3D engine)
Series: **Monkey King, 5 parts** (P1 published 26 Nov). Next: P2 (script + voice ready in `shorts/monkey2/`), P3 Heaven's Worst Job, P4 War With Heaven, P5 The Palm (cliffhanger → next series). After P5 start a new multi-part original story; the channel hero **Benny** (blue shirt, red scarf, teal hair streak) appears in some episodes.
1. New project `shorts/<slug>/` = copy of the previous part (`web/story.js`, `cast.js`, `mworld.js`, audio script). Shared engine files are symlinks into `shorts/bear/web/`.
2. `python3 timing.py audio/voice.mp3 script.txt --out work` (convert to wav first) → `python3 voice_v2.py` (edit DRAMA word indices) → `python3 envelope.py`.
3. Write shots in `web/story.js` (word-indexed; see Part 1 for every pattern). Preview: `python3 mids.py timing_v2.json` → `node render.mjs stills/a "<frames>"` → `python3 sheet.py stills/a stills/a.jpg 10 220` → LOOK at the sheet; fix blocked cameras, out-of-frame characters, blown-out poofs, too-dark shots.
4. Audio: write `audio_<slug>.py` (copy `shorts/monkey/audio_mk.py`), then `python3 mix.py audio/voice_v2.wav audio/music.wav audio/sfx.wav audio/mix.wav`.
5. Render in chunks under 10 min each: `QS="captions=1" RESUME=1 BUDGET=560 node render.mjs frames "0-N"` (repeat until done; ~2.4 s/frame).
6. `bash finish.sh "Title" ep.mp4`, then the upload copy: `ffmpeg -i out/ep.mp4 -c:v libx264 -crf 24 -maxrate 6M -bufsize 12M -c:a copy out/ep_upload.mp4` (~26 MB).
7. QA: `ffmpeg -i out/ep.mp4 -vf "fps=1/1.6,scale=180:320,tile=11x6" -frames:v 1 out/qa.jpg` → look at it; fix and re-render bad shots.

## 4. Motivational episodes
Use the channel's stickman skill. First research (web search) what motivational Shorts are going viral now in that language; take the structure/angle that made them explode (the "cherry on top": a counterintuitive first line, a shocking stat, a story twist, a loopable last line). Never copy text or footage; write an original script.

## 5. Upload (all channels)
1. Host the file publicly on the `uploads` branch (keeps the main history small):
   ```
   cd /tmp && rm -rf up && mkdir up && cd up && git init -q && git checkout -q --orphan uploads
   cp <file> . && git add . && git commit -qm upload && git push -f https://github.com/mjk42538-svg/kubrix-studio uploads
   ```
   URL: `https://raw.githubusercontent.com/mjk42538-svg/kubrix-studio/uploads/<file>` (each channel's task pushes only its own file name; force-push replaces the branch, so upload right after pushing).
2. Windsor `execute_action` youtube `upload_video` on the channel's account: `video_url`, `title` (<60 chars, curiosity), `description` (1–3 lines + question for comments + 3–5 hashtags incl. #shorts), `tags`, `made_for_kids: false`, `privacy_status: "private"`, `publish_at: "<today>T21:00:00+01:00"` (if already past 20:30 Madrid, use tomorrow 21:00).
3. Thumbnail trick: design the FIRST frame of every video with the big 2–4 word cover title already on it (Luckiest Guy, white/yellow, black outline) over the hook image, so any auto-picked or user-picked early frame works as the cover. Windsor can't set thumbnails or pin comments: save `cover.jpg` and the pinned-comment text in the episode folder and list them in the message to the user.
4. Reply to new comments on the channel's videos (Windsor `reply_to_comment`), short, friendly, in the channel's language.

## 6. Save + report
- Episode folder `office/<channel>/episodes/<date>-<slug>/` (brief, script, upload.md, status.md, cover.jpg; NOT the mp4).
- Append to `used.md`. Commit + push to `main` (`git -c push.negotiate=true push`).
- SendUserMessage: channel, title, one-line story, publish time, video URL, credits left, any problem.

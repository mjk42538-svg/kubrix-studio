# Resume notes (saved 2026-11-26 00:05)

## Channel
Kubrix (YouTube) / Mjkvideos (TikTok). Rule: every new video improves one focus area.

## New engine (shared): ~/shorts/bear/web/{core,rig,anim,fx}.js
PBR plastic + bloom + DOF + ACES. R15 rig with IK, blended faces, lip-sync from work/env*.json.
Monkey project symlinks these files, so edits apply to both projects.

## MONKEY KING Part 1 — ~/shorts/monkey  (PRIORITY)
- Voice: audio/voice.mp3 (user's ElevenLabs "Salva" take). Tightened: audio/voice_v2.wav (99.94 s), work/timing_v2.json, work/env_v2.json
- Story: web/story.js (66 shots), cast web/cast.js, world web/mworld.js
- Audio done: audio/music.wav, audio/sfx.wav, audio/mix.wav (python3 audio_mk.py && python3 mix.py audio/voice_v2.wav audio/music.wav audio/sfx.wav audio/mix.wav)
- Render: ~2706/2998 frames done at stop. Continue:
  `cd ~/shorts/monkey && QS="captions=1" RESUME=1 node render.mjs frames "0-2997"`
- THEN re-render the two fixed shots (code is already fixed; the old frames are wrong):
  `rm frames/f0{201..297}.jpg frames/f{2348..2475}.jpg` then run the same RESUME command again
- Then: `./finish.sh "The Monkey King Part 1" out/monkey_king_p1.mp4` → QA sheet → send to user
- Part 2 script ready: ~/shorts/monkey2/script_tagged.txt (send to the user to record)

## POLAR BEAR video — ~/shorts/bear  (deadline: post before 30 Nov)
- Script: script.txt, 42 shots in web/story.js. Previewed and fixes applied.
- Waiting for the user's voiceover. When it arrives:
  timing.py → voice_v2.py (edit DRAMA set) → envelope.py (copy from monkey) → render with timing_v2/env_v2 → audio (still to be written: vine boom, ice crack, night music) → mix → finish

## 5-part series plan
1 Born From a Rock · 2 The Staff (Dragon King, Book of Death) · 3 Heaven's Worst Job (peaches, 100k soldiers)
4 War With Heaven (Erlang, furnace, golden eyes) · 5 The Palm (Buddha's bet, 500 years) → Season 2

## Update 2026-11-26 07:46 (Kubrix Office started, then paused by user)
- Office folder started in the WORKSPACE at ~/KubrixOffice (the user's computer was offline). Copy it to the user's ~/KubrixOffice when the device connects.
- Trends desk done: ~/KubrixOffice/ideas.md (12 ideas; stars: Thanksgiving food, "6-7" school, Snow Clones).
- Retention desk: Windsor timed out once; the second call was stopped by the user. No stats logged yet.
- Monkey render was restarted with the fixed shots deleted; resume with the same RESUME command.
- Still to write: channel.md, production.md, lessons.md, used.md, and the episode folder for monkey-king-p1.

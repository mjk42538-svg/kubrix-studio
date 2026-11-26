# How Kubrix videos are made (learned from the Nov 2026 sessions)
1. Script: Claude writes script.txt + an ElevenLabs version with [tags] (Eleven v3, young expressive voice, stability ~35%, speed 1.1). The USER records it in ElevenLabs and uploads the MP3 to the chat. (Claude can't hear audio; there's no speech recognition, so alignment uses pauses + the script.)
2. Engine: Claude's cloud workspace, ~/shorts/<slug>/ — three.js r160 rendered headless (Chrome + SwiftShader, ~2.4 s/frame at 1080x1920).
   Shared engine: ~/shorts/bear/web/{core,rig,anim,fx}.js (PBR plastic, bloom, DOF, R15 rig, IK, blended faces, lip-sync).
   Per-episode: web/story.js (word-indexed shots), world file, cast file.
3. Voice: python3 timing.py audio/voice.wav script.txt --out work → python3 voice_v2.py (gap caps + 1.10x speed → timing_v2.json) → python3 envelope.py (lip-sync).
4. Previews: python3 mids.py timing_v2.json → node render.mjs stills/a "<frames>" → sheet.py; fix framing.
5. Audio: python3 audio_<x>.py (synth music + SFX) → python3 mix.py voice music sfx out (music & SFX at −6 dB vs voice).
6. Render: QS="captions=1" RESUME=1 node render.mjs frames "0-N" (chunks of <10 min; resumable).
7. Finish: bash finish.sh "Title" file.mp4 (−14 LUFS, H.264 CRF 17, QA). Upload copy: CRF 24, max 6 Mbps (~26 MB).
8. Upload: YouTube via the Windsor.ai connector (account "123744"; upload_video needs a PUBLIC direct link ≤100 MB, e.g. Dropbox dl=1), or the user uploads manually. TikTok: manual upload (Windsor only handles TikTok comments).
   Publish ONLY after the user approves the episode.
9. Credits: no paid tools used (Flashloop has no subscription; don't use it).

#!/bin/bash
set -e
cd "$(dirname "$0")"
I=$(ffmpeg -hide_banner -i audio/mix.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(-14.0 - ($I))")
echo "measured $I LUFS, gain $G dB"
ffmpeg -y -v error -i audio/mix.wav -af "volume=${G}dB,alimiter=limit=0.891:attack=5:release=50:level=false" -ar 48000 -ac 2 audio/final.wav
ffmpeg -y -v error -framerate 30 -i frames/f%04d.jpg -i audio/final.wav -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart -metadata title="$1" "out/$2"
ffmpeg -hide_banner -i "out/$2" -af ebur128 -f null - 2>&1 | grep -E "I:|Peak" | tail -2
ffmpeg -hide_banner -i "out/$2" -vf "freezedetect=n=0.001:d=0.4,blackdetect=d=0.1" -an -f null - 2>&1 | grep -E "freeze|black" || echo "no freezes/black"
ffmpeg -y -v error -i "out/$2" -vf "fps=1/1.8,scale=216:384,tile=10x4" -frames:v 1 out/qa_sheet.jpg

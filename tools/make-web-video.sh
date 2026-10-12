#!/usr/bin/env bash
# Сжатие видео для сайта: H.264 + AAC, faststart, 720p, постер.
# Запуск из корня репозитория: bash tools/make-web-video.sh <исходник> <имя-без-расширения> [maxrate]
set -euo pipefail
SRC="$1"; NAME="$2"; OUT_DIR="${OUT_DIR:-media}"
command -v ffmpeg >/dev/null || { echo "Нет ffmpeg: brew install ffmpeg"; exit 1; }
mkdir -p "$OUT_DIR"

# Ориентация по исходнику: вертикальное или горизонтальное
IFS=x read W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$SRC")
if [ "$H" -gt "$W" ]; then SCALE="720:1280"; MAXRATE="${3:-2.5M}"; else SCALE="1280:720"; MAXRATE="${3:-1.5M}"; fi
BUF=$(echo "$MAXRATE" | sed 's/M//' | awk '{print $1*2"M"}')

ffmpeg -y -v error -i "$SRC" \
  -map 0:v:0 -map 0:a:0? -map_metadata -1 \
  -vf "scale=${SCALE}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${SCALE}:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -crf 23 -maxrate "$MAXRATE" -bufsize "$BUF" \
  -c:a aac -b:a 128k -ac 2 -ar 48000 \
  -movflags +faststart "$OUT_DIR/$NAME.mp4"

# Постер: кадр на 4-й секунде. Если он неудачный, перегенерировать с другим -ss
ffmpeg -y -v error -ss 4 -i "$OUT_DIR/$NAME.mp4" -frames:v 1 -q:v 3 "$OUT_DIR/$NAME-poster.jpg"

SIZE=$(du -m "$OUT_DIR/$NAME.mp4" | cut -f1)
echo "$OUT_DIR/$NAME.mp4 — ${SIZE} МБ"
[ "$SIZE" -le 50 ] || echo "ВНИМАНИЕ: больше 50 МБ — снизь maxrate (третий аргумент) и пережми"

#!/usr/bin/env bash
# Renders every app icon and the splash mark from assets/brand/wave-mark.svg.
# Needs rsvg-convert and ImageMagick.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/brand/wave-mark.svg
BG='#FAFAF8'
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

# App icon: mark at ~60% on off-white, full bleed.
rsvg-convert -w 620 -h 620 "$SRC" -o "$tmp/mark620.png"
convert -size 1024x1024 "xc:$BG" "$tmp/mark620.png" -gravity center -composite assets/icon.png

# Android adaptive icon: transparent foreground inside the 66% safe zone.
rsvg-convert -w 560 -h 560 "$SRC" -o "$tmp/mark560.png"
convert -size 1024x1024 xc:none "$tmp/mark560.png" -gravity center -composite assets/android-icon-foreground.png
convert -size 1024x1024 "xc:$BG" assets/android-icon-background.png
convert assets/android-icon-foreground.png -alpha extract -background black -alpha shape \
  -fill white -colorize 100 assets/android-icon-monochrome.png

# Splash: the mark alone; app config centres it on the off-white background.
rsvg-convert -w 512 -h 512 "$SRC" -o assets/splash-icon.png

# Web favicon.
convert assets/icon.png -resize 48x48 assets/favicon.png
echo "Icons written to assets/."

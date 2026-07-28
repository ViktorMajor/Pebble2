# Pebble bowl sound asset requirements

No audio files ship in this milestone. Sounds remain disabled by default until original or properly licensed recordings meet these requirements.

- Format: mono `.m4a` (AAC-LC) or `.wav` source, 44.1/48 kHz, 16/24-bit; keep the lossless master outside the app.
- Send: dry stone lift or faint stone/ceramic friction, 180–450 ms, no tonal resonance.
- Arrival: soft stone-to-ceramic contact, 250–650 ms, rounded transient, no bell-like tail.
- Touch: almost inaudible dry contact, 80–220 ms.
- Trim: less than 15 ms leading silence; short natural fade; no clipped transient or artificial reverb.
- Loudness: approximately -24 to -20 LUFS integrated, peaks below -6 dBFS. Haptics must remain the primary feedback.
- Licensing: repository-compatible original recording or explicit redistribution license, documented beside the files.
- Runtime: suppress overlaps and repeated events, release players on background/route teardown, and respect the in-app Sounds setting and device volume.

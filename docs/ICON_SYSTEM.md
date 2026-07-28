# Pebble icon system

The icon is a deliberately simplified top-view bowl with three unlabelled pebbles. It uses the product's graphite, smoke-grey, and warm mineral palette without text, letters, hearts, or realistic rendering.

- `assets/icon.png`: full application icon.
- `assets/android-icon-foreground.png`: adaptive foreground with transparent safe area.
- `assets/android-icon-background.png`: solid graphite adaptive background.
- `assets/android-icon-monochrome.png`: single-color Android themed-icon silhouette.
- `assets/splash-icon.png`: splash-compatible full mark.
- `assets/notification-icon.png`: white-on-transparent Android status-bar silhouette; never use the full-color icon here.
- `assets/icon-source/`: deterministic SVG masters created for Pebble. They contain no third-party artwork.

Keep the bowl centered inside the adaptive-icon safe zone. The notification mark must remain flat monochrome because Android applies the system tint.

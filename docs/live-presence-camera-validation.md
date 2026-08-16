# Live Activity and Flight Camera Validation

## 2026-08-16 visual review

The landing page rendered with the map centred on New York at both desktop (1280 × 720) and mobile (375 × 812) viewports. The lower-corner live-activity indicator was visible, readable, and did not obstruct the origin, destination, duration, search, or map controls. It displayed real-time channel state as **1 traveler here · 0 flying** during the single active validation session.

The active-flight camera is configured to retain the aircraft in a forward-looking view: when a flight is active, it raises the map zoom to at least 6.4 and centres the viewport ahead of the plane along its geographic bearing. This leaves visual route context in front of the aircraft while smoothly following its progress.

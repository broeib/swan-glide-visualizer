# Spline Ribbon and Audio Sync Architecture

We chose to decouple visual spline gliding from polyphonic audio triggering, using a fixed 5-voice ribbon structure across all chord steps. Holding steady pitch lines for 3.5 beats and executing cubic S-curve transitions in the final 0.5 beats provides the characteristic Swan Glide aesthetic while preserving note readability at the playhead. Re-triggering polyphonic voices cleanly at chord boundaries with a filtered Rhodes envelope avoids the pitch-bend artifacts and microtonal dissonance common to polyphonic portamento in Web Audio.

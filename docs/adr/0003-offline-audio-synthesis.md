# Offline Audio Synthesis via Headless Chromium

We decided to synthesize polyphonic multi-track audio headlessly using the browser OfflineAudioContext inside headless Chromium rather than managing native Linux audio DAWs, external Python sound synthesizers, or server soundcards. OfflineAudioContext renders full arrangements (Rhodes keys, sub-bass, and drum loops) faster than real time directly into a 48kHz lossless WAV buffer in memory, eliminating audio hardware dependencies on headless Linux cloud VMs.

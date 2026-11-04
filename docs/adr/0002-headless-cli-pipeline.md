# Headless CLI Video Rendering Pipeline

We decided to decouple video generation from manual browser exports by building an automated headless CLI pipeline driven by headless Chromium and FFmpeg. The existing client-side MediaRecorder approach required an open browser tab running in real time, which cannot support automated daily batch jobs or scheduled cron tasks on a cloud server. Driving deterministic frame capture headlessly into FFmpeg ensures exact 60FPS pacing, zero dropped frames, and background execution without human intervention.

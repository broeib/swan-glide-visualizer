import { runPipeline, PipelineRunOptions } from './pipelineRunner';

/**
 * Parses command-line arguments into PipelineRunOptions.
 */
export function parseArgs(args: string[]): PipelineRunOptions {
  const options: PipelineRunOptions = {
    count: 10,
    outputDir: 'output'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === '--count' || arg === '-c') {
      const val = parseInt(args[++i] || '10', 10);
      options.count = isNaN(val) ? 10 : val;
    } else if (arg === '--mood' || arg === '-m') {
      options.mood = args[++i];
    } else if (arg === '--instrument' || arg === '-i') {
      options.instrument = args[++i];
    } else if (arg === '--theme' || arg === '-t') {
      options.theme = args[++i];
    } else if (arg === '--output-dir' || arg === '-o') {
      options.outputDir = args[++i];
    } else if (arg === '--duration-beats' || arg === '-d') {
      const val = parseInt(args[++i] || '0', 10);
      if (!isNaN(val) && val > 0) {
        options.durationBeats = val;
      }
    } else if (arg === '--artist') {
      options.artistHandle = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Swan Glide Headless Video Pipeline CLI

Usage:
  node scripts/run-pipeline.js [options]

Options:
  --count, -c <N>             Number of videos to generate (default: 3)
  --mood, -m <archetype>      Harmonic archetype ('dreamy-major', 'melancholy-minor',
                              'spicy-altered', 'smooth-rnb', or 'random')
  --instrument, -i <inst>     Instrument diagram ('guitar', 'piano', or 'random')
  --theme, -t <preset>        Visual theme preset ('pastel', 'dark', 'sunset',
                              'lofi', 'cream', or 'random')
  --output-dir, -o <path>     Target output directory (default: output)
  --duration-beats, -d <N>    Render duration in beats (default: full progression)
  --artist <handle>           Artist watermark handle (default: @ultravioletchorus)
  --help, -h                  Show this help message
`);
      process.exit(0);
    }
  }

  return options;
}

// Execute if run directly
const args = process.argv.slice(2);
const options = parseArgs(args);

runPipeline(options)
  .then((result) => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Fatal pipeline error:', err);
    process.exit(1);
  });

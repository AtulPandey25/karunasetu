if (process.env.NODE_ENV !== 'production') {
  // Use a dynamic import that we can await at the top level.
  // This ensures that the .env file is loaded synchronously before any other
  // application code runs, fixing the race condition.
  const { default: dotenv } = await import('dotenv');
  const { default: path } = await import('path');
  const { fileURLToPath } = await import('url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

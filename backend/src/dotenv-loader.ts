if (process.env.NODE_ENV !== 'production') {
  Promise.all([import('dotenv'), import('path'), import('url')]).then(([{ default: dotenv }, path, { fileURLToPath }]) => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  }).catch(err => console.error('Failed to load dotenv:', err));
}

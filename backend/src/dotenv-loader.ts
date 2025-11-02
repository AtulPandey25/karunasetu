if (process.env.NODE_ENV !== 'production') {
  // This is the definitive fix. By constructing the package name from a
  // variable, we prevent Vite's static analysis from hoisting the import.
  // This ensures `dotenv` is never included in the production bundle.
  Promise.all([import('module'), import('path')]).then(([{ createRequire }, path]) => {
    const require = createRequire(import.meta.url);
    const dotenvPackageName = 'dotenv';
    const dotenv = require(dotenvPackageName);
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  });
}

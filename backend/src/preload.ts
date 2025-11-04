import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// This script is preloaded to ensure .env variables are available before any other code runs.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
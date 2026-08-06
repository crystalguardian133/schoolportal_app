import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public/build/manifest.webmanifest');
const destination = resolve(root, 'public/manifest.webmanifest');

if (existsSync(source)) {
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(source, destination);
    console.log(`PWA: copied manifest to ${destination}`);
} else {
    console.warn('PWA: manifest.webmanifest not found, skipping copy.');
}

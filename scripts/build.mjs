import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const isWindows = process.platform === 'win32';

if (isWindows) {
    const phpDir = 'C:\\laragon\\bin\\php\\php-8.3.30-Win32-vs16-x64';

    if (existsSync(phpDir)) {
        process.env.PATH = `${phpDir};${process.env.PATH}`;
    } else {
        console.warn('build: Laragon PHP directory not found, using php from PATH.');
    }
}

const run = (command, args) => {
    const result = spawnSync(command, args, { stdio: 'inherit', shell: isWindows });

    if (result.error) {
        console.error(`build: failed to run "${command}"`, result.error.message);
        process.exit(1);
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
};

run('vite', ['build']);
run('node', ['scripts/copy-pwa-manifest.mjs']);

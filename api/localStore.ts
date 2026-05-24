import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export function createLocalStore(filename, logPrefix = 'State') {
    const dataFile = path.resolve(process.cwd(), filename);

    return {
        async readState() {
            try {
                if (!existsSync(dataFile)) {
                    return { data: null, sha: null };
                }

                const content = await readFile(dataFile, 'utf-8');
                return {
                    data: JSON.parse(content),
                    sha: null
                };
            } catch (err) {
                if (err.code === 'ENOENT') {
                    return { data: null, sha: null };
                }
                throw err;
            }
        },

        async writeState(data, sha, cause) {
            const content = JSON.stringify(data, null, 2);
            await writeFile(dataFile, content, 'utf-8');
            console.log(`✅ ${logPrefix} saved locally: ${cause}`);
        }
    };
}

const store = createLocalStore('data.json', 'State');

export const readState = store.readState;
export const writeState = store.writeState;

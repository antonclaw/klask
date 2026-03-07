import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'master';

export function createGithubStore(path) {
    return {
        async readState() {
            try {
                const res = await octokit.repos.getContent({
                    owner: OWNER,
                    repo: REPO,
                    path,
                    ref: BRANCH
                });

                const content = Buffer
                    .from(res.data.content, 'base64')
                    .toString('utf-8');

                return {
                    data: JSON.parse(content),
                    sha: res.data.sha
                };
            } catch (err) {
                if (err.status === 404) {
                    return { data: null, sha: null };
                }
                throw err;
            }
        },

        async writeState(data, sha, cause) {
            const content = Buffer
                .from(JSON.stringify(data, null, 2))
                .toString('base64');

            const payload = {
                owner: OWNER,
                repo: REPO,
                path,
                message: `${cause}`,
                content,
                branch: BRANCH
            };

            if (sha) {
                payload.sha = sha;
            }

            await octokit.repos.createOrUpdateFileContents(payload);
        }
    };
}

const store = createGithubStore(process.env.GITHUB_PATH);

export const readState = store.readState;
export const writeState = store.writeState;

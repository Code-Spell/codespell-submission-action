import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import { Buffer } from 'buffer';

interface CodeSource {
    filename: string;
    extension: string;
    path: string;
    code: string;
}

async function obtainAuthToken(): Promise<string> {
    const username = core.getInput('username');
    const password = core.getInput('password');
    const authUrl = core.getInput('auth-url');
    const authRealm = core.getInput('auth-realm');

    if (!username || !password) {
        throw new Error('Username and password must be provided for authentication.');
    }

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');
    params.append('client_id', 'frontend-dev');

    try {
        const response = await fetch(`${authUrl}/realms/${authRealm}/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Token request failed with status ${response.status}`);
        }

        const data = await response.json() as { access_token?: string };
        if (!data.access_token) {
            throw new Error('Authentication failed: missing access token in response.');
        }

        return data.access_token;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Authentication failed: ${error.message}`);
        } else {
            throw new Error(`Authentication failed: ${String(error)}`);
        }
    }
}

export async function run(): Promise<void> {
    try {
        const contentId = core.getInput('content-id');
        const language = core.getInput('language');
        const apiUrl = core.getInput('api-url');
        const sourcePath = core.getInput('source-path');

        const excludedPaths = core
            .getInput('exclude-paths')
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);

        const files = globSync(`${sourcePath}/**/*.*`, {
            nodir: true,
            ignore: excludedPaths.map((p: string) => `${p}/**`)
        });

        const codeSources: CodeSource[] = files.map((file: string) => {
            const content = fs.readFileSync(file);
            const parsed = path.parse(file);
            const code = Buffer.from(content.toString('utf-8')).toString('base64');

            if (code.length > 65535) {
                core.warning(`File ${file} exceeds the maximum allowed size of 65535 bytes and will be skipped.`);
                return null;
            }

            return {
                filename: parsed.name,
                extension: parsed.ext.replace('.', ''),
                path: parsed.dir,
                code: Buffer.from(content.toString('utf-8')).toString('base64')
            };
        }).filter((v): v is CodeSource => !!v);

        const authToken = await obtainAuthToken();
        const payload = {
            contentId,
            language,
            codeSources
        };

        const response = await fetch(`${apiUrl}/submissions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        core.info('Submission created successfully');

        const data = await response.json();
        if (data.id) {
            core.setOutput('submission-id', data.id);
        }

    } catch (error: unknown) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed(String(error));
        }
    }
}

run();
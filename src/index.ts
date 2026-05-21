import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { globSync } from 'glob';
import { Buffer } from 'buffer';

interface CodeSource {
    filename: string;
    extension: string;
    path: string;
    code: string;
}

async function run(): Promise<void> {
    try {
        const contentId = core.getInput('content-id');
        const language = core.getInput('language');
        const userId = core.getInput('user-id');
        const authToken = core.getInput('auth-token');
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

            return {
                filename: parsed.name,
                extension: parsed.ext.replace('.', ''),
                path: parsed.dir,
                code: Buffer.from(content.toString('utf-8')).toString('base64')
            };
        });

        const payload = {
            contentId,
            language,
            userId,
            codeSources
        };

        const response = await axios.post(
            `${apiUrl}/submissions`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        core.info('Submission created successfully');

        if (response.data.id) {
            core.setOutput('submission-id', response.data.id);
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
const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const glob = require('glob');

async function run() {
    try {
        const apiUrl = core.getInput('api-url');
        const apiToken = core.getInput('api-token');
        const contentId = core.getInput('content-id');
        const language = core.getInput('language');
        const sourcePath = core.getInput('source-path');

        const files = glob.sync(`${sourcePath}/**/*.*`, {
            nodir: true,
            ignore: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**'
            ]
        });

        const codeSources = files.map(file => {
            const content = fs.readFileSync(file);

            const parsed = path.parse(file);

            return {
                filename: parsed.name,
                extension: parsed.ext.replace('.', ''),
                path: parsed.dir,
                code: content.toString('base64')
            };
        });

        const payload = {
            contentId,
            language,
            codeSources
        };

        const response = await axios.post(
            `${apiUrl}/submissions`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        core.info(`Submission created successfully`);

        if (response.data.id) {
            core.setOutput('submission-id', response.data.id);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
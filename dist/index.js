/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const glob = require('glob');

async function run() {
    try {
        const contentId = core.getInput('content-id');
        const language = core.getInput('language');
        const userId = core.getInput('user-id');
        const authToken = core.getInput('auth-token');
        const apiUrl = core.getInput('api-url');
        
        const sourcePath = core.getInput('source-path');
        const excludedPaths = core.getInput('exclude-paths').split(',').map(p => p.trim());

        const files = glob.sync(`${sourcePath}/**/*.*`, {
            nodir: true,
            ignore: excludedPaths.map(p => `${p}/**`)
        });

        const codeSources = files.map(file => {
            const content = fs.readFileSync(file);
            const parsed = path.parse(file);

            return {
                filename: parsed.name,
                extension: parsed.ext.replace('.', ''),
                path: parsed.dir,
                code: btoa(content.toString('utf-8'))
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
                    Authorization: `Bearer ${authToken}`,
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


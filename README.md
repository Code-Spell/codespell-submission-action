# CodeSpell Submission Action

A GitHub Action that creates a new CodeSpell submission by collecting source files from a repository and sending them to the CodeSpell REST API.

## How it works

The action:

1. Globs files under the configured `source-path` (e.g. `src/**/*.*`).
2. Reads and base64-encodes each file (skips files larger than 65535 bytes).
3. Obtains an access token from the configured `auth-url`/`auth-realm` using `username` and `password`.
4. Sends the collected files and metadata to the CodeSpell API at `${api-url}/submissions` to create a new submission.

## Inputs

- `api-url`: Base URL for the CodeSpell API (e.g. `https://api.codespell.example`).
- `auth-url`: Base URL for the authentication server used to obtain a token.
- `auth-realm`: Authentication realm (used when building the token endpoint path).
- `username`: Username for authentication (recommended: use a repository secret).
- `password`: Password for authentication (recommended: use a repository secret).
- `content-id`: CodeSpell content identifier.
- `language`: Submission language code (for example `JAVA`).
- `source-path`: Path to the directory to collect source files from (default: `.`).
- `exclude-paths`: Optional comma-separated list of path prefixes to ignore (e.g. `test,docs`).

## Outputs

- `submission-id`: The ID returned by the CodeSpell API for the created submission (if available).

## Example workflow

```yaml
name: Submit to CodeSpell

on:
  push:
    branches:
      - main

jobs:
  submit:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - id: submit
        name: Create CodeSpell submission
        uses: code-spell/codespell-submission-action@v1
        with:
          api-url: https://api.codespell.net
          auth-url: https://auth.codespell.net
          auth-realm: codespell-prod
          username: ${{ secrets.CODESPELL_USERNAME }}
          password: ${{ secrets.CODESPELL_PASSWORD }}
          content-id: 82587fa8-aed5-4ef0-90f6-7a2894ceb7c4
          language: JAVA
          source-path: src
          exclude-paths: test,docs

      - name: Show submission id
        run: echo "Submission ID: ${{ steps.submit.outputs.submission-id }}"
```

## Live Example

You can find an example repository using this action at [Library Management System](https://github.com/Code-Spell/Library-Management-System).

## Notes

- The action expects Node 20, which is available on current GitHub-hosted runners.
- Files larger than 65535 bytes are skipped and will emit a warning.


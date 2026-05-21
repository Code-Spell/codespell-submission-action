# CodeSpell Submission Action

A GitHub Action that creates a new CodeSpell submission on every push by collecting source files from the repository and sending them to the CodeSpell REST API.

## How it works

The action:

1. Enumerates tracked files in the repository with `git ls-files`.
2. Filters the list to source-like files and any optional include/exclude prefixes you provide.
3. Reads each file, base64-encodes the contents, and maps it to the `codeSources` schema expected by CodeSpell.
4. Sends a `POST` request to `{baseUrl}/submissions` with `contentId`, `language`, and `codeSources`.

## Inputs

- `base-url`: Base URL for the CodeSpell API.
- `token`: CodeSpell API token used as a Bearer token.
- `content-id`: CodeSpell content identifier.
- `language`: Submission language code, for example `JAVA`.
- `include-paths`: Optional comma-separated list of file or directory prefixes to include.
- `exclude-paths`: Optional comma-separated list of file or directory prefixes to exclude.

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

      - name: Create CodeSpell submission
        uses: your-org/codespell-submission-action@v1
        with:
          base-url: https://api.codespell.example
          token: ${{ secrets.CODESPELL_TOKEN }}
          content-id: 82587fa8-aed5-4ef0-90f6-7a2894ceb7c4
          language: JAVA
          include-paths: src,com,app
```

## Notes

- The action expects Node 20, which is available on current GitHub-hosted runners.
- Binary files are skipped automatically.
- The action submits the current tracked source state from the checked-out commit.

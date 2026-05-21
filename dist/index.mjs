// src/index.ts
import * as core from "@actions/core";
import fs from "fs";
import path from "path";
import axios from "axios";
import { globSync } from "glob";
import { Buffer } from "buffer";
async function obtainAuthToken() {
  const username = core.getInput("username");
  const password = core.getInput("password");
  const authUrl = core.getInput("auth-url");
  const authRealm = core.getInput("auth-realm");
  if (!username || !password) {
    throw new Error("Username and password must be provided for authentication.");
  }
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  params.append("grant_type", "password");
  params.append("client_id", "frontend-dev");
  try {
    const response = await axios.post(
      `${authUrl}/realms/${authRealm}/protocol/openid-connect/token`,
      params
    );
    return response.data.access_token;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Authentication error:", error.response.data);
      throw new Error(`Authentication failed: ${error.response.data}`);
    } else {
      throw new Error(`Authentication failed: ${String(error)}`);
    }
  }
}
async function run() {
  try {
    const contentId = core.getInput("content-id");
    const language = core.getInput("language");
    const apiUrl = core.getInput("api-url");
    const authToken = await obtainAuthToken();
    console.log("Authentication successful, obtained token.");
    console.log(`Using AUTH TOKEN: ${authToken}`);
    const sourcePath = core.getInput("source-path");
    const excludedPaths = core.getInput("exclude-paths").split(",").map((p) => p.trim()).filter(Boolean);
    const files = globSync(`${sourcePath}/**/*.*`, {
      nodir: true,
      ignore: excludedPaths.map((p) => `${p}/**`)
    });
    const codeSources = files.map((file) => {
      const content = fs.readFileSync(file);
      const parsed = path.parse(file);
      const code = Buffer.from(content.toString("utf-8")).toString("base64");
      if (code.length > 65535) {
        core.warning(`File ${file} exceeds the maximum allowed size of 65535 bytes and will be skipped.`);
        return null;
      }
      return {
        filename: parsed.name,
        extension: parsed.ext.replace(".", ""),
        path: parsed.dir,
        code: Buffer.from(content.toString("utf-8")).toString("base64")
      };
    }).filter((v) => !!v);
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
          "Content-Type": "application/json"
        }
      }
    );
    core.info("Submission created successfully");
    if (response.data.id) {
      core.setOutput("submission-id", response.data.id);
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(String(error));
    }
  }
}
run();
export {
  run
};

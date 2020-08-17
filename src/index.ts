import { getInput } from "@actions/core";
import { getOctokit } from "@actions/github";
import slugify from "@sindresorhus/slugify";
import { execSync } from "child_process";
import { readJson, writeFile, copyFile } from "fs-extra";
import { join } from "path";

export const run = async () => {
  const token = getInput("GITHUB_TOKEN");
  const octokit = getOctokit(token);
};

run();

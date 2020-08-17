import { getInput } from "@actions/core";
import { getOctokit } from "@actions/github";
import slugify from "@sindresorhus/slugify";
import { execSync } from "child_process";
import { readJson, writeFile, copyFile } from "fs-extra";
import { join } from "path";

const createRobotsTxt = (path: string) =>
  writeFile(
    path,
    `User-agent: *
Disallow: /`
  );
export const run = async () => {
  const token = getInput("token");
  const prefix = getInput("prefix");
  const robotsPath = getInput("robotsPath");
  const octokit = getOctokit(token);
  const ev = await readJson(process.env.GITHUB_EVENT_PATH || "");

  if (!ev.pull_request) return;
  const slug = slugify(ev.pull_request.head.ref);
  const prNumber = ev.pull_request.number;
  const prTitle = ev.pull_request.title;
  console.log(`Deploying ${prNumber}`, slug);

  if (robotsPath) await createRobotsTxt(robotsPath);

  await copyFile(
    join(".", "__sapper__", "export", "select-a-language", "index.html"),
    join(".", "__sapper__", "export", "index.html")
  );

  try {
    const result = execSync(
      `surge --project __sapper__/export --domain ${prefix}-${slug}.surge.sh`
    ).toString();
    console.log(result);
  } catch (error) {
    console.log(error);
  }

  console.log("Deployed", `https://${prefix}-${slug}.surge.sh`);
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `This pull request has been automatically deployed.
✅ Preview: https://${prefix}-${slug}.surge.sh
🔍 Logs: https://github.com/${prefix}-co/koj/actions/runs/${process.env.GITHUB_RUN_ID}`,
  });
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: prNumber,
    labels: ["deployed"],
  });
  console.log("Commented");
};

run();

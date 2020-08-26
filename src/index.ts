import { getInput, setFailed, debug } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import slugify from "@sindresorhus/slugify";
import { execSync } from "child_process";
import { writeFile } from "fs-extra";

const createRobotsTxt = (path: string, robotsContent?: string) =>
  writeFile(
    path,
    robotsContent ||
      `User-agent: *
Disallow: /`
  );

export const run = async () => {
  const token = getInput("token") || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GitHub token not found");

  if (!context.payload.pull_request && !context.ref)
    return console.log("Skipped");

  execSync("npm install --global surge");

  const prefix =
    getInput("prefix") || slugify(`${context.repo.owner}/${context.repo.repo}`);
  const robotsTxtPath = getInput("robotsTxtPath");
  const distDir = getInput("distDir");
  const addDeployment = getInput("deploymentEnvironment");
  const octokit = getOctokit(token);

  if (robotsTxtPath)
    await createRobotsTxt(robotsTxtPath, getInput("robotsTxtContent"));

  let deployment: any = undefined;
  if (addDeployment)
    deployment = await octokit.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.ref,
      environment: getInput("environmentName") || "Preview",
      production_environment: false,
    });
  console.log("Added deployment");

  if (context.payload.pull_request) {
    const slug = slugify(context.payload.pull_request.head.ref);
    const prNumber = context.payload.pull_request.number;
    console.log(`Deploying ${prNumber}`, slug);

    try {
      const result = execSync(
        `surge --project ${distDir} --domain ${prefix}-${slug}.surge.sh`
      ).toString();
      console.log(result);
      console.log("Deployed", `https://${prefix}-${slug}.surge.sh`);
      if (addDeployment)
        await octokit.repos.createDeploymentStatus({
          owner: context.repo.owner,
          repo: context.repo.repo,
          deployment_id: (deployment.data as any).id,
          state: "success",
          environment_url: `https://${prefix}-${slug}.surge.sh`,
          log_url: `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        });
    } catch (error) {
      console.log("ERROR", error.status);
      console.log(error.message);
      console.log(error.stderr.toString());
      console.log(error.stdout.toString());
      if (addDeployment)
        await octokit.repos.createDeploymentStatus({
          owner: context.repo.owner,
          repo: context.repo.repo,
          deployment_id: (deployment.data as any).id,
          state: "error",
        });
      console.log("Added deployment success fail");
      setFailed("Deployment error");
    }

    if (!getInput("skipComment")) {
      const comments = await octokit.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
      });
      const hasComment = !!comments.data.find((comment) =>
        comment.body.includes(
          "This pull request has been automatically deployed."
        )
      );
      if (!hasComment) {
        await octokit.issues.createComment({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: prNumber,
          body: `This pull request has been automatically deployed.
✅ Preview: https://${prefix}-${slug}.surge.sh
🔍 Logs: https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        });
        console.log("Added comment to PR");
      } else {
        console.log("PR already has comment");
      }
    }

    if (!getInput("skipLabels"))
      await octokit.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        labels: (getInput("labels") || "deployed")
          .split(",")
          .map((label) => label.trim()),
      });
    console.log("Added label");
  } else if (context.ref) {
    const slug = slugify(context.ref.replace("refs/heads/", ""));
    console.log("Deploying commit", slug);
    try {
      const result = execSync(
        `surge --project ${distDir} --domain ${prefix}-${slug}.surge.sh`
      ).toString();
      console.log(result);
      console.log("Deployed", `https://${prefix}-${slug}.surge.sh`);
      if (addDeployment)
        await octokit.repos.createDeploymentStatus({
          owner: context.repo.owner,
          repo: context.repo.repo,
          deployment_id: (deployment.data as any).id,
          state: "success",
          environment_url: `https://${prefix}-${slug}.surge.sh`,
          log_url: `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        });
    } catch (error) {
      console.log(error);
      if (addDeployment)
        await octokit.repos.createDeploymentStatus({
          owner: context.repo.owner,
          repo: context.repo.repo,
          deployment_id: (deployment.data as any).id,
          state: "error",
        });
      console.log("Added deployment success fail");
      setFailed("Deployment error");
    }
  }
};

run();

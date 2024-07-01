import { readFileSync } from "fs";
import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";

const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");
const octokit = new Octokit({ auth: GITHUB_TOKEN });

export interface IPullRequest {
  owner: string;
  repo: string;
  pull_number: number;
  title: string;
  description: string;
}

export async function getPRDetails(): Promise<IPullRequest> {
  const { repository, number } = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH || "", "utf8"),
  );

  const response = await octokit.pulls.get({
    owner: repository.owner.login,
    repo: repository.name,
    pull_number: number,
  });

  return {
    owner: repository.owner.login,
    repo: repository.name,
    pull_number: number,
    title: response.data.title ?? "",
    description: response.data.body ?? "",
  };
}

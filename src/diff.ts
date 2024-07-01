import { Octokit } from "@octokit/rest";
import { File as IParseDiffFile } from "parse-diff";
import * as core from "@actions/core";
import { minimatch } from "minimatch";
import { getPRDetails } from "./pr";
import { GitHubEvent } from "./types";

const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");
const octokit = new Octokit({ auth: GITHUB_TOKEN });

export async function getDiff(
  owner: string,
  repo: string,
  pull_number: number,
): Promise<string | null> {
  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: { format: "diff" },
  });

  // @ts-expect-error - response.data is a string
  return response.data;
}

export async function getUpdatedDiff(
  owner: string,
  repo: string,
  baseSha: string,
  headSha: string,
): Promise<string> {
  const response = await octokit.repos.compareCommits({
    headers: {
      accept: "application/vnd.github.v3.diff",
    },
    owner,
    repo,
    base: baseSha,
    head: headSha,
  });

  return String(response.data);
}

export function filterDiffFiles(
  parsedDiff: IParseDiffFile[],
): IParseDiffFile[] {
  const excludePatterns = core
    .getInput("EXCLUDE")
    .split(",")
    .map((s) => s.trim());

  return parsedDiff.filter((file) => {
    return !excludePatterns.some((pattern) =>
      minimatch(file.to ?? "", pattern),
    );
  });
}

export const getDifferenceByActionType = async (event: GitHubEvent ) => {
  const prDetails = await getPRDetails();

  if (event.action === "opened" || event.action === "review_requested") {
    return await getDiff(
      prDetails.owner,
      prDetails.repo,
      prDetails.pull_number,
    );
  } else if (event.action === "synchronize" && event.before && event.after) {
    const newBaseSha = event.before;
    const newHeadSha = event.after;

    return await getUpdatedDiff(
      prDetails.owner,
      prDetails.repo,
      newBaseSha,
      newHeadSha,
    );
  } else {
    console.log("Unsupported event:", process.env.GITHUB_EVENT_NAME);
  }

  return null;
};

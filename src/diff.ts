import parseDiff, { File as IParseDiffFile } from "parse-diff";
import * as core from "@actions/core";
import { minimatch } from "minimatch";
import { IPullRequest } from "./types";

import githubService from "./Services/Github";

export const filterDiffFiles = (diff: string): IParseDiffFile[] => {
  const excludePatterns = core
    .getInput("EXCLUDE")
    .split(",")
    .map((s) => s.trim());

  return parseDiff(diff).filter((file) => {
    return !excludePatterns.some((pattern) =>
      minimatch(file.to ?? "", pattern),
    );
  });
};

export const getDifference = async (pr: IPullRequest) => {
  const { action, before, after } = githubService.getRepository();
  let diff: string | null = null;

  if (action === "opened" || action === "review_requested") {
    const { owner, repo, pull_number } = pr;

    diff = await githubService.getDiff(owner, repo, pull_number);
  }

  if (action === "synchronize" && before && after) {
    const newBaseSha = before;
    const newHeadSha = after;

    diff = await githubService.getUpdatedDiff(
      pr.owner,
      pr.repo,
      newBaseSha,
      newHeadSha,
    );
  }

  if (diff) {
    return filterDiffFiles(diff);
  } else {
    return null;
  }
};

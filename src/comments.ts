import { Octokit } from "@octokit/rest";
import { File as IParseDiffFile, Chunk } from "parse-diff";
import * as core from "@actions/core";
import { IPullRequest } from "./pr";
import { createPrompt, getAIResponse } from "./ai";

const GITHUB_TOKEN: string = core.getInput("GITHUB_TOKEN");
const CUSTOM_PROMPTS = core
  .getMultilineInput("CUSTOM_PROMPTS")
  .map((customPrompt) => `- ${customPrompt}`)
  .join("\n");

const octokit = new Octokit({ auth: GITHUB_TOKEN });

export async function createReviewComment(
  owner: string,
  repo: string,
  pull_number: number,
  comments: Array<{ body: string; path: string; line: number }>,
): Promise<void> {
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    comments,
    event: "COMMENT",
  });
}

export function createComment(
  file: IParseDiffFile,
  chunk: Chunk,
  aiResponses: Array<{
    lineNumber: string;
    reviewComment: string;
  }>,
): Array<{ body: string; path: string; line: number }> {
  return aiResponses.flatMap((aiResponse) => {
    if (!file.to) {
      return [];
    }

    return {
      body: aiResponse.reviewComment,
      path: file.to,
      line: Number(aiResponse.lineNumber),
    };
  });
}

export async function getComments(
  parsedDiff: IParseDiffFile[],
  prDetails: IPullRequest,
): Promise<Array<{ body: string; path: string; line: number }>> {
  const comments: Array<{ body: string; path: string; line: number }> = [];

  for (const file of parsedDiff) {
    if (file.to === "/dev/null") {
      // Ignore deleted files
      continue;
    }

    for (const chunk of file.chunks) {
      const prompt = createPrompt(file, chunk, prDetails, CUSTOM_PROMPTS);
      const response = await getAIResponse(prompt);

      if (response) {
        const newComments = createComment(file, chunk, response);
        if (newComments) {
          comments.push(...newComments);
        }
      }
    }
  }

  return comments;
}

import { Octokit } from "@octokit/rest";
import { File as IParseDiffFile, Chunk } from "parse-diff";
import * as core from "@actions/core";
import { createPrompt } from "./ai";
import { IPullRequest } from "./types";
import openAIService from "./Services/OpenAI";
import githubHttpClient from "./HttpClients/Github";

const CUSTOM_PROMPTS = core
  .getMultilineInput("CUSTOM_PROMPTS")
  .map((customPrompt) => `- ${customPrompt}`)
  .join("\n");

export async function createReviewComment(
  pr: IPullRequest,
  comments: Array<{ body: string; path: string; line: number }>,
): Promise<void> {
  const { owner, repo, pull_number } = pr;

  await githubHttpClient.pulls.createReview({
    owner,
    repo,
    pull_number,
    comments,
    event: "COMMENT",
  });
}

export function createComment(
  file: IParseDiffFile,
  reviews: Array<{
    lineNumber: string;
    reviewComment: string;
  }>,
): Array<{ body: string; path: string; line: number }> {
  return reviews.flatMap((aiResponse) => {
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
  diff: IParseDiffFile[],
  pr: IPullRequest,
): Promise<Array<{ body: string; path: string; line: number }>> {
  const comments: Array<{ body: string; path: string; line: number }> = [];

  for (const file of diff) {
    if (file.to === "/dev/null") {
      // Ignore deleted files
      continue;
    }

    for (const chunk of file.chunks) {
      const prompt = createPrompt(file, chunk, pr, CUSTOM_PROMPTS);
      const reviews = await openAIService.getReviews(prompt);

      if (reviews) {
        const comments = createComment(file, reviews);
        if (comments) {
          comments.push(...comments);
        }
      }
    }
  }

  return comments;
}

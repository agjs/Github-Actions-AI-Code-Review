import { Octokit } from "@octokit/rest";
import { readFileSync } from "fs";
import { IComment, IPullRequest } from "../../types";
import githubHttpClient from "../../HttpClients/Github";
class GithubService {
  octokit: Octokit;

  constructor(githubHttpClient: Octokit) {
    this.getRepository = this.getRepository.bind(this);
    this.getPRDetails = this.getPRDetails.bind(this);
    this.getDiff = this.getDiff.bind(this);
    this.getUpdatedDiff = this.getUpdatedDiff.bind(this);
    this.createComment = this.createComment.bind(this);

    this.octokit = githubHttpClient;
  }

  getRepository() {
    const repository = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH || "", "utf8"),
    );

    return {
      name: repository.repository.name,
      owner: repository.owner.login,
      pullRequestNumber: repository.number,
      action: repository.action,
      before: repository.before,
      after: repository.after,
    };
  }

  async getPRDetails(): Promise<IPullRequest> {
    const { name, owner, pullRequestNumber } = this.getRepository();
    const { data } = await this.octokit.pulls.get({
      owner,
      repo: name,
      pull_number: pullRequestNumber,
    });

    return {
      title: data.title ?? "",
      description: data.body ?? "",
      owner,
      repo: name,
      pull_number: pullRequestNumber,
    };
  }

  async getDiff(
    repositoryOwner: string,
    repositoryName: string,
    pullRequestNumber: number,
  ): Promise<string | null> {
    const response = await this.octokit.pulls.get({
      owner: repositoryOwner,
      repo: repositoryName,
      pull_number: pullRequestNumber,
      mediaType: { format: "diff" },
    });

    // @ts-expect-error - response.data is a string because of mediaType format: "diff"
    return response.data;
  }

  async getUpdatedDiff(
    repositoryOwner: string,
    repositoryName: string,
    baseSha: string,
    headSha: string,
  ): Promise<string> {
    const response = await this.octokit.repos.compareCommits({
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
      owner: repositoryOwner,
      repo: repositoryName,
      base: baseSha,
      head: headSha,
    });

    return String(response.data);
  }

  async createComment(
    pr: IPullRequest,
    comments: Array<IComment>,
  ): Promise<void> {
    const { owner, repo, pull_number } = pr;

    await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      comments,
      event: "COMMENT",
    });
  }
}

export default new GithubService(githubHttpClient);

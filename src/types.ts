export interface IRepository {
  name: string;
  owner: {
    login: string;
  };
}

export interface IPullRequest {
  number: number;
  title: string;
  body: string;
}

export interface IPullRequestEvent {
  action: string;
  number: number;
  repository: IRepository;
  pull_request: IPullRequest;
  before?: string; // Optional, only exists for certain actions
  after?: string; // Optional, only exists for certain actions
}

export interface IPushEvent {
  ref: string;
  before: string;
  after: string;
  repository: IRepository;
}

export type GitHubEvent = IPullRequestEvent

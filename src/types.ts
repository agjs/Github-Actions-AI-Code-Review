export interface IRepository {
  name: string;
  owner: {
    login: string;
  };
}

export interface IPullRequest {
  title: string;
  description: string;
  owner: string;
  pull_number: number;
  repo: string;
}

export interface IPullRequestEvent {
  action: string;
  number: number;
  repository: IRepository;
  pull_request: IPullRequest;
  before?: string;
  after?: string;
}

export type GitHubEvent = IPullRequestEvent;

export enum ResponseFormatType {
  Text = "text",
  JsonObject = "json_object",
}

export interface IComment {
  body: string;
  path: string;
  line: number;
}

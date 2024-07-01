export interface IPullRequest {
  title: string;
  description: string;
  owner: string;
  pull_number: number;
  repo: string;
}

export enum ResponseFormatType {
  Text = "text",
  JsonObject = "json_object",
}

export interface IComment {
  body: string;
  path: string;
  line: number;
}

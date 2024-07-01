import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";

export default new Octokit({ auth: core.getInput("GITHUB_TOKEN") });

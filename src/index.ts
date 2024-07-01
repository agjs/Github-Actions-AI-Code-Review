import { getPRDetails } from "./pr";
import { filterDiffFiles, getDifferenceByActionType } from "./diff";
import { createReviewComment, getComments } from "./comments";
import parseDiff from "parse-diff";
import { readFileSync } from "fs";

async function main() {
  const pr = await getPRDetails();
  const event = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8"),
  );

  const diff = await getDifferenceByActionType(event);
  if (!diff) {
    return;
  }

  const parsedDiff = parseDiff(diff);
  const filteredDiff = filterDiffFiles(parsedDiff);

  const comments = await getComments(filteredDiff, pr);
  if (!comments.length) {
    return;
  }

  await createReviewComment(pr.owner, pr.repo, pr.pull_number, comments);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

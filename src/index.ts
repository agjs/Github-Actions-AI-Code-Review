import { getDifference } from "./diff";
import { createReviewComment, getComments } from "./comments";
import githubService from "./Services/Github";

async function main() {
  const pr = await githubService.getPRDetails();
  const diff = await getDifference(pr);

  if (!diff || (Array.isArray(diff) && !diff.length)) {
    return;
  }

  const comments = await getComments(diff, pr);
  if (!comments.length) {
    return;
  }

  await githubService.createComment(pr, comments);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

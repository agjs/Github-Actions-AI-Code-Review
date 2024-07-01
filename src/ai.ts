import OpenAI from "openai";
import * as core from "@actions/core";
import { File as IParseDiffFile, Chunk } from "parse-diff";
import { IPullRequest } from "./pr";

const OPENAI_API_KEY: string = core.getInput("OPENAI_API_KEY");
const OPENAI_API_MODEL: string = core.getInput("OPENAI_API_MODEL");
const MAX_TOKENS: number = Number(core.getInput("MAX_TOKENS"));
const LANGUAGE: string = core.getInput("LANGUAGE");

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export function createPrompt(
  file: IParseDiffFile,
  chunk: Chunk,
  prDetails: IPullRequest,
  customPrompts: string,
): string {
  return `Your task is to review pull requests. Instructions:
- Provide the response in following JSON format:  {"reviews": [{"lineNumber":  <line_number>, "reviewComment": "<review comment>"}]}
- Do not give positive comments or compliments.
- Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
- Write the comment in GitHub Markdown format.
- Use the given description only for the overall context and only comment the code.
- IMPORTANT: NEVER suggest adding comments to the code.
${customPrompts}

Review the following code diff in the file "${file.to}" and take the pull request title and description into account when writing the response.
  
Pull request title: ${prDetails.title}
Pull request description:

---
${prDetails.description}
---

Git diff to review:

\`\`\`diff
${chunk.content}
${chunk.changes
  // @ts-expect-error - ln and ln2 exists where needed
  .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
  .join("\n")}
\`\`\`
`;
}

export async function getAIResponse(prompt: string): Promise<Array<{
  lineNumber: string;
  reviewComment: string;
}> | null> {
  const config = {
    model: OPENAI_API_MODEL,
    temperature: 0.2,
    MAX_TOKENS: MAX_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  try {
    const response = await openai.chat.completions.create({
      ...config,
      ...(OPENAI_API_MODEL === "gpt-4o"
        ? { response_format: { type: "json_object" } }
        : {}),
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "system",
          content: `(OOC: Answer in ${LANGUAGE})`,
        },
      ],
    });

    const res = response.choices[0].message?.content?.trim() || "{}";
    return JSON.parse(res).reviews;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

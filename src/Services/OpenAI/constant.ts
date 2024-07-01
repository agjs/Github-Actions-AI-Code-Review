import * as core from "@actions/core";
import { ResponseFormatType } from "../../types";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

export const getOpenAIConfig = (
  prompt: string,
): ChatCompletionCreateParamsBase => {
  const OPENAI_API_MODEL = core.getInput("OPENAI_API_MODEL");
  const MAX_TOKENS = Number(core.getInput("MAX_TOKENS"));
  const LANGUAGE = core.getInput("LANGUAGE");

  const config: ChatCompletionCreateParamsBase = {
    model: OPENAI_API_MODEL,
    temperature: 0.2,
    max_tokens: MAX_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: { type: ResponseFormatType.Text },
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
  };

  if (OPENAI_API_MODEL === "gpt-4o") {
    config["response_format"] = { type: ResponseFormatType.JsonObject };
  }

  return config;
};

import * as core from "@actions/core";
import OpenAI from "openai";
import { getOpenAIConfig } from "./constant";
import { ChatCompletion } from "openai/resources";
import openAIHttpClient from "../../HttpClients/OpenAI";

class OpenAIService {
  OPENAI_API_MODEL: string;
  MAX_TOKENS: number;
  openai: OpenAI;

  constructor(openAIHttpClient: OpenAI) {
    this.OPENAI_API_MODEL = core.getInput("OPENAI_API_MODEL");
    this.MAX_TOKENS = Number(core.getInput("MAX_TOKENS"));
    this.openai = openAIHttpClient;

    this.getReviews = this.getReviews.bind(this);
  }

  /**
   * Get reviews from OpenAI API.
   * @param prompt - The prompt to send to OpenAI API.
   * @returns Array of reviews or null if there is an error.
   */
  async getReviews(prompt: string): Promise<Array<{
    lineNumber: string;
    reviewComment: string;
  }> | null> {
    const config = getOpenAIConfig(prompt);

    try {
      const { choices } = (await this.openai.chat.completions.create(
        config,
      )) as ChatCompletion;

      const [choice] = choices;

      if (!choice.message?.content) {
        return null;
      }

      return JSON.parse(choice.message.content.trim())?.reviews;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }
}

export default new OpenAIService(openAIHttpClient);

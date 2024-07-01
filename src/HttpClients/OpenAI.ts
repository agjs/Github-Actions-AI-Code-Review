import * as core from "@actions/core";
import OpenAI from "openai";

export default new OpenAI({
  apiKey: core.getInput("OPENAI_API_KEY"),
});

import { last } from "lodash";
import {
  MessageModel,
  ModelInvokeBody,
  SupportedModelArns,
  SupportedModels,
} from "../@types/schemas";
import { NotImplementedError, ValueError } from "./error-handler";
import { GENERAL_CONFIG } from "../config";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelResponse,
} from "@aws-sdk/client-bedrock-runtime";
import { flow, get, toString, trim } from "lodash/fp";

const client = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || "us-east-1",
});

const claudeModelInvokeBody = (prompt: string) => ({
  ...GENERAL_CONFIG,
  prompt: `Human: ${prompt}\nAssistant: `,
});

export const modelInvokeBody = (prompt: string): ModelInvokeBody => ({
  "anthropic.claude-instant-v1": claudeModelInvokeBody(prompt),
  "anthropic.claude-v2": claudeModelInvokeBody(prompt),
  "antrophic.claude-3-sonnet-20240229-v1:0": claudeModelInvokeBody(prompt),
});

const createInvokeCommand = (modelId: SupportedModelArns, prompt: string) =>
  new InvokeModelCommand({
    modelId,
    body: JSON.stringify(modelInvokeBody(prompt)[modelId]),
    accept: "application/json",
    contentType: "application/json",
  });

export const getBufferString = (conversations: MessageModel[]): string => {
  const stringMessages: string[] = [];

  conversations.forEach(({ role, content: { body } }) => {
    if (!["assistant", "user", "system"].includes(role))
      throw new ValueError(`Unsupported role: ${role}`);

    const prefix =
      role === "assistant"
        ? "Assistant: "
        : role === "user"
        ? "Human: "
        : undefined;
    if (prefix) stringMessages.push(`${prefix}${body}`);
  });

  // If the last message is from the user, add a prefix.
  // Ref: https://docs.anthropic.com/claude/docs/introduction-to-prompt-design#human--assistant-formatting
  if (last(conversations)?.role === "user") stringMessages.push("Assistant: ");

  return stringMessages.join("\n");
};

type ModelMapping = { [key in SupportedModels]: SupportedModelArns };

export const getModelId = (model: SupportedModels): SupportedModelArns => {
  // Ref: https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids-arns.html
  if (!["claude-instant-v1", "claude-v2", "claude-v3-sonnet"].includes(model))
    throw new NotImplementedError(`Model '${model}' is not implemented`);

  const modelMapping: ModelMapping = {
    "claude-instant-v1": "anthropic.claude-instant-v1",
    "claude-v2": "anthropic.claude-v2",
    "claude-v3-sonnet": "antrophic.claude-3-sonnet-20240229-v1:0",
  };
  return modelMapping[model];
};

const extractOutputText = (
  model: SupportedModels,
  response: InvokeModelResponse
): string => {
  if (!["claude-instant-v1", "claude-v2", "claude-v3-sonnet"].includes(model))
    throw new NotImplementedError(`Model '${model}' is not implemented`);

  if (!response.body) return "";

  return flow(
    Buffer.from,
    toString,
    JSON.parse,
    get("completion"),
    trim
  )(response.body);
};

export const invoke = async (prompt: string, model: SupportedModels) => {
  const command = createInvokeCommand(getModelId(model), prompt);
  console.log("Bedrock command:", command);
  const response = await client.send(command);
  console.log("Bedrock response:", response);
  const outputText = extractOutputText(model, response);
  console.log("Output text:", outputText);
  return outputText;
};

import { APIGatewayEvent, APIGatewayProxyResult, SNSEvent } from "aws-lambda";
import { ApiGatewayManagementApi } from "aws-sdk";
import { BedrockRuntime, ResponseStream } from "@aws-sdk/client-bedrock-runtime";
import { flow, get, join, map } from 'lodash/fp';
import { ChatInputWithToken } from "./@types/schemas";
import { getCurrentUserFromToken } from "./helper/auth";
import { getInvokePayload, prepareConversation, storeConversation } from "./routes/conversation.route";
import { InternalServerException, ModelStreamErrorException, ModelTimeoutException, PartBody, PayloadPart, ThrottlingException, ValidationException } from "aws-sdk/clients/bedrockruntime";
import { v4 as uuidv4 } from 'uuid';

console.log("Initalizing BedrockRuntime...");
const client = new BedrockRuntime({
  region: process.env.BEDROCK_REGION || 'us-east-1',
});

async function* generateChunk(stream: AsyncIterable<ResponseStream>): AsyncGenerator<PartBody> {
  if (stream) {
    for await (const event of stream) {
      const {chunk} = event as {
        chunk?:PayloadPart,
        internalServerException?:InternalServerException,
        modelStreamErrorException?:ModelStreamErrorException,
        modelTimeoutException?:ModelTimeoutException,
        throttlingException?:ThrottlingException,
        validationException?:ValidationException,
      };
      if (chunk && chunk.bytes) {
        yield chunk.bytes;
      }
    }
  }
}

export const handler = async (event: SNSEvent): Promise<APIGatewayProxyResult> => {
  console.log(`Received event: ${JSON.stringify(event)}`);

  // Extracting the SNS message and its details
  // NOTE: All notification messages will contain a single published message.
  // See `Reliability` section of: https://aws.amazon.com/sns/faqs/
  const messageContent = flow(
    get('Records'),
    get(0),
    get('Sns'),
    get('Message'),
    JSON.parse,
  )(event) as APIGatewayEvent;
  const {
    body: message,
    requestContext: {
      connectionId,
      domainName,
      stage,
    }
  } = messageContent;
  const endpoint = `https://${domainName}/${stage}`;
  console.log(`Endpoint: ${endpoint}`);
  const gatewayApi = new ApiGatewayManagementApi({
    endpoint,
  });
  const chatInput = JSON.parse(message as string) as ChatInputWithToken;
  console.log(`Received chat input: ${message}`);

  const user = await getCurrentUserFromToken(chatInput.token);
  const { messageId: userMsgId, conversation } = await prepareConversation(user.sub, chatInput);
  const payload = getInvokePayload(conversation, chatInput);
  const response = await client.invokeModelWithResponseStream(payload);
  const stream = response.body;
  if (!stream) {
    console.log('No stream returned from model invocation.');
    return { statusCode: 200, body: '' };
  }

  const textDecoder = new TextDecoder('utf-8');
  const completions: string[] = [];
  for await (const chunk of generateChunk(stream)) {
    // console.log("Process chunk...", chunk);
    await gatewayApi.postToConnection({
      ConnectionId: connectionId as string,
      Data: chunk,
    }).promise();
    const completion = flow(
      map((byte: number) => String.fromCharCode(byte)),
      join(''),
      JSON.parse,
      get('completion'),
    )(chunk as number[])
    console.log("Received chunk:", completion);
    completions.push(completion);
  }

  const concatenated = completions.join('');
  console.log("Concatenated text:", concatenated);

  const assistantMsgId = uuidv4();
  conversation.messageMap[assistantMsgId] = {
    role: 'assistant',
    content: {
      contentType: 'text',
      body: concatenated,
    },
    model: chatInput.message.model,
    children: [],
    parent: userMsgId,
    createTime: Date.now(),
  };
  conversation.messageMap[userMsgId].children.push(assistantMsgId);
  conversation.lastMessageId = assistantMsgId;

  console.log("Storing conversation:", conversation);
  const storeResult = await storeConversation(user.sub, conversation);
  console.log("Store result:", storeResult);

  return {
    statusCode: 200,
    body: JSON.stringify({
      conversationId: conversation.id,
    }),
  };
};

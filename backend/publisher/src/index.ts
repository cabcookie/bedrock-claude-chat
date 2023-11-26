import { APIGatewayEvent } from "aws-lambda";
import { SNS } from "aws-sdk";

const TOPIC_ARN: string = process.env.WEBSOCKET_TOPIC_ARN!;
const snsClient = new SNS();

export const handler = async (event: APIGatewayEvent) => {
  console.log(`Received event: ${JSON.stringify(event)}`);
  const { routeKey } = event.requestContext;

  if (routeKey === "$connect")
    return { statusCode: 200, body: "Connected." };

  const { requestContext, body } = event;
  
  try {
    const snsResponse = await snsClient.publish({
      TopicArn: TOPIC_ARN,
      Message: JSON.stringify({ requestContext, body }),
    }).promise();
    console.log("SNS response:", snsResponse);

    return {
      statusCode: 200,
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error }),
    };
    
  }
};

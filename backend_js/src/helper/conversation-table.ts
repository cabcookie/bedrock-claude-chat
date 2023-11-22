import { DynamoDB, STS } from 'aws-sdk';

type QueryInput = Omit<DynamoDB.DocumentClient.QueryInput, 'TableName'>;

/**
 * Get a DynamoDB document client with row level access
 * Ref: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_examples_dynamodb_items.html
 * 
 * @param userId the user Id from Cognito for row-level access permissions
 * @param tableName the name of the DynamoDB table to query
 * @returns DynamoDB.DocumentClient
 */
const getDocumentClient = async (userId: string, tableName: string): Promise<DynamoDB.DocumentClient> => {
  const {
    ACCOUNT,
    REGION,
    AWS_EXECUTION_ENV,
    DDB_ENDPOINT_URL,
    TABLE_ACCESS_ROLE_ARN,
  } = process.env;

  console.log("getDocumentClient...");

  if (!AWS_EXECUTION_ENV) {
    let ddb: DynamoDB.DocumentClient;
    if (DDB_ENDPOINT_URL) {
      console.log("local development");
      ddb = new DynamoDB.DocumentClient({
        endpoint: DDB_ENDPOINT_URL,
        credentials: {
          accessKeyId: 'fakeMyKeyId',
          secretAccessKey: 'fakeSecretAccessKey',
          sessionToken: 'fakeSessionToken',
        },
        region: 'us-east-1',
      });
    } else {
      console.log("fall back?");
      ddb = new DynamoDB.DocumentClient();
    }
    console.log("ddb", ddb);
    return ddb;
  }

  console.log("Assuming role to access table with row-level security");
  const sts = new STS();
  const assumedRole = await sts.assumeRole({
    RoleArn: TABLE_ACCESS_ROLE_ARN as string,
    RoleSessionName: 'DynamoDBSession',
    Policy: JSON.stringify({
      Statement: [{
        Effect: 'Allow',
        Action: [
          'dynamodb:DeleteItem',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:Query',
          'dynamodb:UpdateItem',
          // 'dynamodb:BatchGetItem',
          // 'dynamodb:BatchWriteItem',
          // 'dynamodb:ConditionCheckItem',
          // 'dynamodb:DescribeTable',
          // 'dynamodb:GetRecords',
          // 'dynamodb:Scan',
        ],
        Resource: [
          `arn:aws:dynamodb:${REGION}:${ACCOUNT}:table/${tableName}`,
          `arn:aws:dynamodb:${REGION}:${ACCOUNT}:table/${tableName}/index/*`,
        ],
        Condition: {
          // Allow access to items with the same partition key as the user id
          'ForAllValues:StringEquals': {
            'dynamodb:LeadingKeys': [userId],
          },
        },
      }],
    }),
  }).promise();
  console.log("assumedRole", assumedRole);
  const credentials = assumedRole.Credentials as AWS.STS.Credentials;
  console.log("credentials", credentials);
  const ddb = new DynamoDB.DocumentClient({
    region: REGION,
    credentials: {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    },
  });
  console.log("ddb", ddb);
  return ddb;
};

export const getTableClient = async (userId: string) => {
  const {
    TABLE_NAME,
  } = process.env;

  console.log("getDocumentClient...");
  const ddb = await getDocumentClient(userId, TABLE_NAME as string);

  return {
    query: (props: QueryInput) => ddb.query({
      ...props,
      TableName: TABLE_NAME as string,
    }).promise(),
  };
};

import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  ObjectOwnership,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Auth } from "./constructs/auth";
import { Api } from "./constructs/api";
import { Database } from "./constructs/database";
import { Frontend } from "./constructs/frontend";
import { WebSocket } from "./constructs/websocket";
import { CustomDomain, CustomDomainProps } from "./constructs/custom-domain";

export interface BedrockChatStackProps extends StackProps {
  readonly bedrockRegion: string;
  readonly customDomain?: CustomDomainProps;
  readonly webAclId: string;
}

export class BedrockChatStack extends Stack {
  constructor(scope: Construct, id: string, props: BedrockChatStackProps) {
    super(scope, id, props);

    let customDomain: CustomDomain | undefined;
    if (props.customDomain)
      customDomain = new CustomDomain(this, "CustomDomain", {...props.customDomain});

    const accessLogBucket = new Bucket(this, "AccessLogBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
    });

    const auth = new Auth(this, "Auth");
    const database = new Database(this, "Database");

    const backendApi = new Api(this, "BackendApi", {
      database: database.table,
      auth,
      bedrockRegion: props.bedrockRegion,
      tableAccessRole: database.tableAccessRole,
      customDomain: customDomain?.customDomainProps,
    });

    // For streaming response
    const websocket = new WebSocket(this, "WebSocket", {
      database: database.table,
      tableAccessRole: database.tableAccessRole,
      auth,
      bedrockRegion: props.bedrockRegion,
      customDomain: customDomain?.customDomainProps,
    });

    const frontend = new Frontend(this, "Frontend", {
      backendApiEndpoint: backendApi.apiEndpoint,
      webSocketApiEndpoint: websocket.deprecatedWebSocketEndpoint,
      customDomain: customDomain?.customDomainProps,
      auth,
      accessLogBucket,
      webAclId: props.webAclId,
    });

    new CfnOutput(this, "FrontendUrl", {
      value: frontend.frontEndUrl,
    });
    new CfnOutput(this, "BackendApiUrl", {
      value: backendApi.apiEndpoint,
    });
    new CfnOutput(this, "DeprecatedWebSocketEndpoint", {
      value: websocket.deprecatedWebSocketEndpoint,
    });
    new CfnOutput(this, "WebSocketEndpoint", {
      value: websocket.webSocketEndpoint,
    });
  }
}

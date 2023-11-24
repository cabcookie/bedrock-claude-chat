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
import { DomainAliasProps, Frontend } from "./constructs/frontend";
import { WebSocket } from "./constructs/websocket";

export interface BedrockChatStackProps extends StackProps {
  readonly bedrockRegion: string;
  readonly domainAlias?: DomainAliasProps;
  readonly webAclId: string;
}

export class BedrockChatStack extends Stack {
  constructor(scope: Construct, id: string, props: BedrockChatStackProps) {
    super(scope, id, props);

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
      domainAlias: props.domainAlias,
      auth,
      bedrockRegion: props.bedrockRegion,
      tableAccessRole: database.tableAccessRole,
    });

    // For streaming response
    const websocket = new WebSocket(this, "WebSocket", {
      database: database.table,
      tableAccessRole: database.tableAccessRole,
      auth,
      bedrockRegion: props.bedrockRegion,
    });

    const frontend = new Frontend(this, "Frontend", {
      backendApiEndpoint: backendApi.api.apiEndpoint,
      webSocketApiEndpoint: websocket.apiEndpoint,
      domainAlias: props.domainAlias,
      auth,
      accessLogBucket,
      webAclId: props.webAclId,
    });

    new CfnOutput(this, "FrontendURL", {
      value: `https://${props.domainAlias
        ? props.domainAlias.alias
        : frontend.cloudFrontWebDistribution.distributionDomainName}`,
    });
  }
}

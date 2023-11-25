import { Construct } from "constructs";
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { WebSocketLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Duration, Stack } from "aws-cdk-lib";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as sns from "aws-cdk-lib/aws-sns";
import { SnsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Auth } from "./auth";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { CfnRouteResponse } from "aws-cdk-lib/aws-apigatewayv2";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { FrontendDomainProps } from "./frontend";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayv2DomainProperties } from "aws-cdk-lib/aws-route53-targets";

export interface WebSocketProps {
  readonly database: ITable;
  readonly auth: Auth;
  readonly bedrockRegion: string;
  readonly customDomain?: FrontendDomainProps;
  readonly tableAccessRole: iam.IRole;
}

export class WebSocket extends Construct {
  readonly webSocketEndpoint: string;
  private readonly defaultStageName = "dev";

  constructor(scope: Construct, id: string, props: WebSocketProps) {
    super(scope, id);

    const { database, tableAccessRole } = props;

    const topic = new sns.Topic(this, "SnsTopic", {
      displayName: "WebSocketTopic",
    });

    const publisher = new NodejsFunction(this, "PublisherJs", {
      runtime: Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../../../backend/publisher/src/index.ts"),
      logRetention: 7,
      handler: "handler",
      environment: {
        WEBSOCKET_TOPIC_ARN: topic.topicArn,
      },
    });
    topic.grantPublish(publisher);

    const handlerRole = new iam.Role(this, "HandlerRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    handlerRole.addToPolicy(
      // Assume the table access role for row-level access control.
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [tableAccessRole.roleArn],
      })
    );
    handlerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:*"],
        resources: ["*"],
      })
    );

    handlerRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    const handler = new DockerImageFunction(this, "Handler", {
      code: DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../../backend_python"),
        {
          platform: Platform.LINUX_AMD64,
          file: "websocket.Dockerfile",
        }
      ),
      memorySize: 256,
      timeout: Duration.minutes(15),
      environment: {
        ACCOUNT: Stack.of(this).account,
        REGION: Stack.of(this).region,
        USER_POOL_ID: props.auth.userPool.userPoolId,
        CLIENT_ID: props.auth.client.userPoolClientId,
        BEDROCK_REGION: props.bedrockRegion,
        TABLE_NAME: database.tableName,
        TABLE_ACCESS_ROLE_ARN: tableAccessRole.roleArn,
      },
      role: handlerRole,
    });
    handler.addEventSource(
      new SnsEventSource(topic, {
        filterPolicy: {},
      })
    );

    const api = new apigwv2.WebSocketApi(this, "WebSocketApi", {
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "ConnectIntegration",
          publisher
        ),
      },
    });
    const route = api.addRoute("$default", {
      integration: new WebSocketLambdaIntegration(
        "DefaultIntegration",
        publisher
      ),
    });
    const stage = new apigwv2.WebSocketStage(this, "WebSocketStage", {
      webSocketApi: api,
      stageName: this.defaultStageName,
      autoDeploy: true,
    });
    api.grantManageConnections(handler);

    new CfnRouteResponse(this, "RouteResponse", {
      apiId: api.apiId,
      routeId: route.routeId,
      routeResponseKey: "$default",
    });

    let webSocketEndpoint = api.apiEndpoint;
    if (props.customDomain) {
      const alias = 'ws';
      const domainName = new apigwv2.DomainName(this, "WebSocketDomain", {
        domainName: `${alias}.${props.customDomain.name}`,
        certificate: props.customDomain.certificate,
      });
      const apiMapping = new apigwv2.ApiMapping(this, "WebSocketMapping", { api, domainName, stage });
      apiMapping.node.addDependency(domainName);
      // webSocketEndpoint = `wss://${alias}.${props.customDomain.name}`;
      if (props.customDomain.hostedZone)
        new ARecord(this, "WebSocketAlias", {
          zone: props.customDomain.hostedZone,
          recordName: alias,
          target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(domainName.regionalDomainName, domainName.regionalHostedZoneId)),
        });
    }

    this.webSocketEndpoint = `${webSocketEndpoint}/${this.defaultStageName}`;
  }
}

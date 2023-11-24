import { Construct } from "constructs";
import { CfnOutput, Duration } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { HttpUserPoolAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { Auth } from "./auth";
import { Stack } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { DomainAliasProps } from "./frontend";

export interface ApiProps {
  readonly database: ITable;
  readonly corsAllowOrigins?: string[];
  readonly auth: Auth;
  readonly bedrockRegion: string;
  readonly domainAlias?: DomainAliasProps;
  readonly tableAccessRole: iam.IRole;
}

export class Api extends Construct {
  readonly api: HttpApi;
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const {
      database,
      tableAccessRole,
      corsAllowOrigins: allowOrigins = ["*"],
      domainAlias,
    } = props;

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

    const handlerJs = new NodejsFunction(this, "HandlerJs", {
      runtime: Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../../../backend/api/src/index.ts"),
      logRetention: 7,
      handler: "handler",
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        TABLE_NAME: database.tableName,
        CORS_ALLOW_ORIGINS: allowOrigins.join(","),
        USER_POOL_ID: props.auth.userPool.userPoolId,
        CLIENT_ID: props.auth.client.userPoolClientId,
        ACCOUNT: Stack.of(this).account,
        REGION: Stack.of(this).region,
        BEDROCK_REGION: props.bedrockRegion,
        TABLE_ACCESS_ROLE_ARN: tableAccessRole.roleArn,
      },
      role: handlerRole,
    });

    const integrationJs = new HttpLambdaIntegration("Integration", handlerJs);
  
    const api = new HttpApi(this, "Default", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.HEAD,
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: allowOrigins,
        maxAge: Duration.days(10),
      },
    });

    const authorizer = new HttpUserPoolAuthorizer(
      "Authorizer",
      props.auth.userPool,
      {
        userPoolClients: [props.auth.client],
      }
    );

    api.addRoutes({
      path: "/v2/{proxy+}",
      integration: integrationJs,
      methods: [
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PUT,
        HttpMethod.PATCH,
        HttpMethod.DELETE,
      ],
      authorizer,
    });

    this.api = api;

    new CfnOutput(this, "BackendApiUrl", { value: api.apiEndpoint });
  }
}

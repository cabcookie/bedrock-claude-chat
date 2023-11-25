import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { HttpUserPoolAuthorizer } from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as apigw2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { Auth } from "./auth";
import { Stack } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { FrontendDomainProps } from "./frontend";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { ApiGatewayv2DomainProperties } from "aws-cdk-lib/aws-route53-targets";

export interface ApiProps {
  readonly database: ITable;
  readonly corsAllowOrigins?: string[];
  readonly auth: Auth;
  readonly bedrockRegion: string;
  readonly customDomain?: FrontendDomainProps;
  readonly tableAccessRole: iam.IRole;
}

export class Api extends Construct {
  readonly api: apigw2.HttpApi;
  readonly apiEndpoint: string;
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const {
      database,
      tableAccessRole,
      corsAllowOrigins: allowOrigins = ["*"],
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

    const handlerJs = new NodejsFunction(this, "ApiHandler", {
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
  
    const api = new apigw2.HttpApi(this, "Default", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [
          apigw2.CorsHttpMethod.GET,
          apigw2.CorsHttpMethod.HEAD,
          apigw2.CorsHttpMethod.OPTIONS,
          apigw2.CorsHttpMethod.POST,
          apigw2.CorsHttpMethod.PUT,
          apigw2.CorsHttpMethod.PATCH,
          apigw2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: allowOrigins,
        maxAge: Duration.days(10),
      },
    });

    let apiEndpoint = api.apiEndpoint;
    if (props.customDomain) {
      const alias = "api";
      const domainName = new apigw2.DomainName(this, "ApiDomain", {
        domainName: `api.${props.customDomain.name}`,
        certificate: props.customDomain.certificate,
      });
      new apigw2.ApiMapping(this, "ApiMapping", { api, domainName });
      apiEndpoint = `https://${alias}.${props.customDomain.name}`;
      if (props.customDomain.hostedZone)
        new ARecord(this, "ApiAlias", {
          zone: props.customDomain.hostedZone,
          recordName: alias,
          target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(domainName.regionalDomainName, domainName.regionalHostedZoneId)),
        });
    }

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
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PUT,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
      ],
      authorizer,
    });

    this.api = api;
    this.apiEndpoint = apiEndpoint;
  }
}

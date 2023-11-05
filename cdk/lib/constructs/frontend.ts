import { Construct } from "constructs";
import { RemovalPolicy, Stack } from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  IBucket,
} from "aws-cdk-lib/aws-s3";
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  ViewerCertificate,
} from "aws-cdk-lib/aws-cloudfront";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { NodejsBuild } from "deploy-time-build";
import { Auth } from "./auth";
import { DomainCertificate } from "./certificate";

export interface FrontendProps {
  readonly backendApiEndpoint: string;
  readonly webSocketApiEndpoint: string;
  readonly domainAlias: string | undefined;
  readonly auth: Auth;
  readonly accessLogBucket: IBucket;
  readonly webAclId: string;
}

export class Frontend extends Construct {
  readonly cloudFrontWebDistribution: CloudFrontWebDistribution;
  declare hostedZone: HostedZone;

  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

    const certificate = !!props.domainAlias && new DomainCertificate(this, 'CustomDomainCert', {
      domainAlias: props.domainAlias,
    });

    const assetBucket = new Bucket(this, "AssetBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const originAccessIdentity = new OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    const distribution = new CloudFrontWebDistribution(this, "Distribution", {
      viewerCertificate: !certificate ? undefined : ViewerCertificate
        .fromAcmCertificate(certificate.domainCertificate, {
          aliases: [props.domainAlias],
        }),
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: assetBucket,
          originAccessIdentity,
        },
        behaviors: [{
          isDefaultBehavior: true,
        }],
      }],
      errorConfigurations: [{
        errorCode: 404,
        errorCachingMinTtl: 0,
        responseCode: 200,
        responsePagePath: "/",
      }, {
        errorCode: 403,
        errorCachingMinTtl: 0,
        responseCode: 200,
        responsePagePath: "/",
      }],
      loggingConfig: {
        bucket: props.accessLogBucket,
        prefix: "Frontend/",
      },
      webACLId: props.webAclId,
    });

    new NodejsBuild(this, "ReactBuild", {
      assets: [{
        path: "../frontend",
        exclude: ["node_modules", "dist"],
        commands: ["npm ci"],
      }],
      buildCommands: ["npm run build"],
      buildEnvironment: {
        VITE_APP_API_ENDPOINT: props.backendApiEndpoint,
        VITE_APP_WS_ENDPOINT: props.webSocketApiEndpoint,
        VITE_APP_USER_POOL_ID: props.auth.userPool.userPoolId,
        VITE_APP_USER_POOL_CLIENT_ID: props.auth.client.userPoolClientId,
        VITE_APP_REGION: Stack.of(props.auth.userPool).region,
        VITE_APP_USE_STREAMING: "true"
      },
      destinationBucket: assetBucket,
      distribution,
      outputSourceDirectory: "dist",
    });

    this.cloudFrontWebDistribution = distribution;
  }
}

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
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { NodejsBuild } from "deploy-time-build";
import { Auth } from "./auth";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

export type DomainAliasProps = {
  alias: string;
  certificate: Certificate;
  managedByRoute53: string;
};

export interface FrontendProps {
  readonly backendApiEndpoint: string;
  readonly webSocketApiEndpoint: string;
  readonly domainAlias?: DomainAliasProps;
  readonly auth: Auth;
  readonly accessLogBucket: IBucket;
  readonly webAclId: string;
}

export class Frontend extends Construct {
  readonly cloudFrontWebDistribution: CloudFrontWebDistribution;

  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

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
      viewerCertificate: !props.domainAlias ? undefined : ViewerCertificate
        .fromAcmCertificate(props.domainAlias.certificate, {
          aliases: [props.domainAlias.alias],
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

    if (props.domainAlias?.managedByRoute53) {
      const zone = HostedZone.fromLookup(this, 'Zone', { domainName: props.domainAlias.managedByRoute53 });
      new ARecord(this, 'FrontendAlias', {
        zone,
        recordName: props.domainAlias.alias,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      });
    }

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

#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BedrockChatStack } from "../lib/bedrock-chat-stack";
import { FrontendWafStack } from "../lib/frontend-waf-stack";

const app = new cdk.App();

const {CDK_DEFAULT_REGION, CDK_DEFAULT_ACCOUNT} = process.env;
const BEDROCK_REGION = app.node.tryGetContext("bedrockRegion");
const DOMAIN_ALIAS = app.node.tryGetContext("domainAlias");
const MANAGED_BY_ROUTE53 = app.node.tryGetContext("hostedByRoute53");
const ALLOWED_IP_V4_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV4AddressRanges"
);
const ALLOWED_IP_V6_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV6AddressRanges"
);

console.log("  ");
console.log("===============================================");
console.log("Installing the stack in different regions.");
console.log("  ");
console.log("WAF:                   ", "us-east-1");
console.log("Bedrock:               ", BEDROCK_REGION);
console.log("Backend and Frontend:  ", CDK_DEFAULT_REGION);
console.log("AWS Account:           ", CDK_DEFAULT_ACCOUNT);
console.log("===============================================");
console.log("  ");

// WAF for frontend
// 2023/9: Currently, the WAF for CloudFront needs to be created in the North America region (us-east-1), so the stacks are separated
// https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html
const waf = new FrontendWafStack(app, `FrontendWafStack`, {
  env: {
    region: "us-east-1",
    account: CDK_DEFAULT_ACCOUNT,
  },
  allowedIpV4AddressRanges: ALLOWED_IP_V4_ADDRESS_RANGES,
  allowedIpV6AddressRanges: ALLOWED_IP_V6_ADDRESS_RANGES,
});

new BedrockChatStack(app, `BedrockChatStack`, {
  env: {
    region: CDK_DEFAULT_REGION,
    account: CDK_DEFAULT_ACCOUNT,
  },
  crossRegionReferences: true,
  bedrockRegion: BEDROCK_REGION,
  customDomain: {
    name: DOMAIN_ALIAS,
    managedByRoute53: MANAGED_BY_ROUTE53,
  },
  webAclId: waf.webAclArn.value,
});

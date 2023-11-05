import { Construct } from "constructs";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { CfnOutput } from "aws-cdk-lib";

export interface DomainCertificateProps {
  readonly domainAlias: string;
}

export class DomainCertificate extends Construct {
  public readonly certificateArn: CfnOutput;
  readonly domainCertificate: Certificate;

  constructor(scope: Construct, id: string, props: DomainCertificateProps) {
    super(scope, id);

    // This step is critical as it will halt the deployment process until you input the relevant CNAME records via your domain registrar.
    // Please ensure that you visit the following link: https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates
    // Here, you can find the specific CNAME records that need to be incorporated.
    // It's worth noting that if you're utilizing Route53, you can conveniently skip this step. More details can be found in the following documentation:
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html#domain-names-and-certificates
    const certificate = new Certificate(scope, `${id}Cert`, {
      certificateName: `${id}Certificate`,
      domainName: props.domainAlias,
      validation: CertificateValidation.fromDns(),
    });

    this.domainCertificate = certificate;
    this.certificateArn = new CfnOutput(this, "CertificateArn", {
      value: certificate.certificateArn,
    });
  }
}

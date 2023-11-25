import { HostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { FrontendDomainProps } from "./frontend";
import { DomainCertificate } from "./certificate";

export interface CustomDomainProps {
  name: string;
  managedByRoute53?: string;
}

export class CustomDomain extends Construct {
  readonly customDomainProps: FrontendDomainProps;

  constructor(scope: Construct, id: string, props: CustomDomainProps) {
    super(scope, id);

    let hostedZone: HostedZone | undefined;
    if (props.managedByRoute53) {
      hostedZone = new PublicHostedZone(this, 'HostedZone', {
        zoneName: props.managedByRoute53,
      });
    }
    const certificate = new DomainCertificate(this, "Certificate", {
      domainAlias: props.name,
      hostedZone,
    });
    this.customDomainProps = {
      ...props,
      certificate: certificate.domainCertificate,
      hostedZone,
    }
  }
}

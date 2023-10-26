import { RemovalPolicy, Stack } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { AccountPrincipal, Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface DatabaseProps {}

export class Database extends Construct {
  readonly conversationTable: Table;
  readonly promptTable: Table;
  readonly tableAccessRole: Role;

  constructor(scope: Construct, id: string, props?: DatabaseProps) {
    super(scope, id);

    const conversationTable = new Table(this, "ConversationTable", {
      partitionKey: { name: "UserId", type: AttributeType.STRING },
      sortKey: { name: "ConversationId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    conversationTable.addGlobalSecondaryIndex({
      indexName: "ConversationIdIndex",
      partitionKey: { name: "ConversationId", type: AttributeType.STRING },
    });

    const promptTable = new Table(this, "PromptTable", {
      partitionKey: { name: "UserId", type: AttributeType.STRING },
      sortKey: { name: "PromptId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    promptTable.addGlobalSecondaryIndex({
      indexName: "PromptIdIndex",
      partitionKey: { name: "PromptId", type: AttributeType.STRING },
    });

    const tableAccessRole = new Role(this, "TableAccessRole", {
      assumedBy: new AccountPrincipal(Stack.of(this).account),
    });
    conversationTable.grantReadWriteData(tableAccessRole);
    promptTable.grantReadWriteData(tableAccessRole);

    this.conversationTable = conversationTable;
    this.promptTable = promptTable;
    this.tableAccessRole = tableAccessRole;
  }
}

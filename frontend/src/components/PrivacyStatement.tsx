import React from "react";
import ModalDialog from "./ModalDialog";
import Button from "./Button";
import { Link } from "@aws-amplify/ui-react";

interface PrivacyStatementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyStatement: React.FC<PrivacyStatementProps> = (props) => (
  <ModalDialog {...props} title="Privacy">
    <div>
      The Chatbot is based on <Link href="https://aws.amazon.com/bedrock/" target="_blank">Amazon Bedrock</Link> using the <Link href="https://aws.amazon.com/bedrock/claude/" target="_blank">Antrophic Claude large-language model</Link>. The authentication and permission management is realized using <Link href="https://aws.amazon.com/cognito/" target="_blank">Amazon Cognito</Link>. The conversations are stored in <Link href="https://aws.amazon.com/dynamodb/" target="_blank">Amazon DynamoDB</Link>. As Carsten hosts the application he is able to see the users as well as the conversations. If you feel uncomfortable about it, I encourage you to host the chatbot yourself. You can find the code on <Link href="https://github.com/cabcookie/bedrock-claude-chat" target="_blank">this GitHub repository</Link>.
    </div>
    <div className="m-4 flex justify-end gap-2">
      <Button onClick={props.onClose}>
        Close
      </Button>
    </div>
  </ModalDialog>  
);

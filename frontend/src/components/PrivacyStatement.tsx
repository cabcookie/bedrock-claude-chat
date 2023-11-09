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
      The Chatbot is hosted by <Link href='https://about.me/kochcarsten' target='_blank'>Carsten Koch</Link>. It is based on <Link href="https://aws.amazon.com/bedrock/" target="_blank">Amazon Bedrock</Link> using the <Link href="https://aws.amazon.com/bedrock/claude/" target="_blank">Antrophic Claude large-language model</Link>. The authentication and permission management is realized using <Link href="https://aws.amazon.com/cognito/" target="_blank">Amazon Cognito</Link>. The conversations are stored in <Link href="https://aws.amazon.com/dynamodb/" target="_blank">Amazon DynamoDB</Link>. As Carsten hosts the application he is able to see the users as well as the conversations. Take this into account when sending chat messages to Bedrock Claude Chat. If you plan to send confidential information to the chat bot, I encourage you to host the chatbot yourself on your AWS account. You can find the code on <Link href="https://github.com/cabcookie/bedrock-claude-chat" target="_blank">this GitHub repository</Link>. Feel free to reach out if you need help by <Link href="https://github.com/cabcookie/bedrock-claude-chat/issues" target="_blank">posting an issue on the repository</Link>. If you want to learn about how AWS is using your data, read the <Link href="https://aws.amazon.com/privacy/" target="_blank">AWS Privacy Policy</Link>.
    </div>
    <div className="m-4 flex justify-end gap-2">
      <Button onClick={props.onClose}>
        Close
      </Button>
    </div>
  </ModalDialog>  
);

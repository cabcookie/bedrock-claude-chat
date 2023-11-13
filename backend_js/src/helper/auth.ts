import { CognitoJwtVerifier } from "aws-jwt-verify";

const tokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID || '',
  tokenUse: "id",
  clientId: process.env.CLIENT_ID || '',
});

// Create a function which finds the current user from Amazon Cognito based on the Authorization token provided
export const getCurrentUser = async (token: string) => {  
  const { sub, email } = await tokenVerifier.verify(token);
  console.log("Response", { sub, email });
  return { sub, email };
};

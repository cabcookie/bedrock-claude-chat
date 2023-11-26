import { CognitoJwtVerifier } from "aws-jwt-verify";
import { IncomingHttpHeaders } from "http";

const tokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID || '',
  tokenUse: "id",
  clientId: process.env.CLIENT_ID || '',
});

export const getCurrentUserFromRequestHeader = async (headers: IncomingHttpHeaders) => {
  // Log authorization token
  const token = headers.authorization?.split(' ')[1];
  return await getCurrentUserFromToken(token);
};

export const getCurrentUserFromToken = async (token: string | undefined) => {
  // console.log('Authorization token:', token);

  const { sub, email } = await tokenVerifier.verify(token || '');
  console.log("Current User", { sub, email });
  return { sub, email };
};

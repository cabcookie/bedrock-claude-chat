import { MessageMap, MessageModel } from "../@types/schemas";

export const traceToRoot = (nodeId: string, messageMap: MessageMap): Array<MessageModel> => {
  const trace: Array<MessageModel> = [];
  let currentMessage = messageMap[nodeId];
  while (currentMessage) {
    trace.push(currentMessage);
    const parentId = currentMessage.parent;
    if (!parentId) break;
    currentMessage = messageMap[parentId];
  }
  return trace.reverse();
};
import { MutatorCallback, useSWRConfig } from 'swr';
import {
  Conversation,
  ConversationMeta,
  PostMessageRequest,
  PostMessageResponse,
} from '../@types/conversation';
import useHttp from './useHttp';

const useConversationApi = () => {
  const http = useHttp();
  const { mutate } = useSWRConfig();

  const updateTitle = (conversationId: string, title: string) => {
    return http.patch(`v2/conversation/${conversationId}/title`, {
      newTitle: title,
    });
  };

  return {
    getConversations: () => {
      return http.get<ConversationMeta[]>('v2/conversations', {
        keepPreviousData: true,
      });
    },
    getConversation: (conversationId?: string) => {
      return http.get<Conversation>(
        !conversationId ? null : `v2/conversation/${conversationId}`,
        {
          keepPreviousData: true,
        }
      );
    },
    postMessage: (input: PostMessageRequest) => {
      return http.post<PostMessageResponse>('v2/conversation', {
        ...input,
      });
    },
    deleteConversation: (conversationId: string) => {
      return http.delete(`v2/conversation/${conversationId}`);
    },
    clearConversations: () => {
      return http.delete('v2/conversations');
    },
    updateTitle,
    updateTitleWithGeneratedTitle: async (conversationId: string) => {
      const res = await http.getOnce<{
        title: string;
      }>(`v2/conversation/${conversationId}/proposed-title`);    
      return updateTitle(conversationId, res.data.title);
    },
    mutateConversations: (
      conversations?:
        | ConversationMeta[]
        | Promise<ConversationMeta[]>
        | MutatorCallback<ConversationMeta[]>,
      options?: Parameters<typeof mutate>[2]
    ) => {
      return mutate('v2/conversations', conversations, options);
    },
  };
};

export default useConversationApi;

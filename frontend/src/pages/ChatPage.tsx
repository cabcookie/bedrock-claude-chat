import React, { useCallback, useEffect, useState } from 'react';
import InputChatContent from '../components/InputChatContent';
import useChat from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import useScroll from '../hooks/useScroll';
import { useParams } from 'react-router-dom';
import { PiArrowsCounterClockwise, PiWarningCircleFill } from 'react-icons/pi';
import Button from '../components/Button';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { MessageContentWithChildren, Model } from '../@types/conversation';
import { BaseProps } from '../@types/common';
import SwitchBedrockModel from '../components/SwitchBedrockModel';

const DrawNoMessages = (t: TFunction<'translation'>) => (
  <>
    <div className="mx-3 my-32 flex items-center justify-center text-4xl font-bold text-gray-500/20">
      {t('app.name')}
    </div>
  </>
);

type DrawMessageProps = BaseProps & {
  message: MessageContentWithChildren;
  onChangeCurrentMessageId: (messageId: string) => void;
  onSubmitEditedContent: (messageId: string, content: string) => void;
};

const DrawMessage: React.FC<DrawMessageProps> = ({
  message,
  onChangeCurrentMessageId,
  onSubmitEditedContent,
}) => (
  <>
    <div
      className={`${message.role === 'assistant' ? 'bg-aws-squid-ink/5' : ''}`}>
      <ChatMessage
        chatContent={message}
        onChangeMessageId={onChangeCurrentMessageId}
        onSubmit={onSubmitEditedContent}
      />
      <div className="w-full border-b border-aws-squid-ink/10"></div>
    </div>
  </>
);

const DrawWarning = (
  t: TFunction<'translation'>,
  retryPostChat: (content?: string | undefined) => void
) => (
  <>
    <div className="mb-12 mt-2 flex flex-col items-center">
      <div className="flex items-center font-bold text-red-500">
        <PiWarningCircleFill className="mr-1 text-2xl" />
        {t('error.answerResponse')}
      </div>

      <Button
        className="mt-2 border-gray-400 bg-white shadow"
        icon={<PiArrowsCounterClockwise />}
        onClick={retryPostChat}>
        {t('button.resend')}
      </Button>
    </div>
  </>
);

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [model, setModel] = useState<Model>('claude-instant-v1');
  const {
    postingMessage,
    postChat,
    messages,
    setConversationId,
    hasError,
    retryPostChat,
    setCurrentMessageId,
    regenerate,
    getPostedModel,
  } = useChat();

  const { scrollToBottom, scrollToTop } = useScroll();

  const { conversationId: paramConversationId } = useParams();

  useEffect(() => {
    setConversationId(paramConversationId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramConversationId]);

  const onSend = useCallback(() => {
    postChat(content, model);
    setContent('');
  }, [content, postChat, model]);

  const onChangeCurrentMessageId = useCallback(
    (messageId: string) => {
      setCurrentMessageId(messageId);
    },
    [setCurrentMessageId]
  );

  const onSubmitEditedContent = useCallback(
    (messageId: string, content: string) => {
      if (hasError) {
        retryPostChat(content);
      } else {
        regenerate({ messageId, content });
      }
    },
    [hasError, regenerate, retryPostChat]
  );

  const onRegenerate = useCallback(() => {
    regenerate();
  }, [regenerate]);

  useEffect(() => {
    messages.length > 0 ? scrollToBottom() : scrollToTop();
  }, [messages, scrollToBottom, scrollToTop]);

  return (
    <>
      <div className="flex flex-col items-center justify-start">
        <div className="m-1">
          <SwitchBedrockModel
            postedModel={getPostedModel()}
            model={model}
            setModel={setModel}
          />
        </div>
        <hr className="w-full border-t border-gray-300" />
      </div>
      <div className="pb-52 lg:pb-40">
        {messages.length === 0
          ? DrawNoMessages(t)
          : messages.map((message, idx) =>
              message.content.body !== '' ? (
                <DrawMessage
                  key={idx}
                  message={message}
                  onChangeCurrentMessageId={onChangeCurrentMessageId}
                  onSubmitEditedContent={onSubmitEditedContent}
                />
              ) : (
                <ChatMessage key={idx} loading />
              )
            )}
        {hasError && DrawWarning(t, retryPostChat)}
      </div>

      <div className="absolute bottom-0 z-0 flex w-full justify-center">
        <InputChatContent
          content={content}
          disabled={postingMessage}
          onChangeContent={setContent}
          onSend={onSend}
          onRegenerate={onRegenerate}
        />
      </div>
    </>
  );
};

export default ChatPage;

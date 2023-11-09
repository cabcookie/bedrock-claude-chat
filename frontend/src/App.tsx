import React, { useCallback, useEffect, useState } from 'react';
import { PiList, PiPlus } from 'react-icons/pi';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import ChatListDrawer from './components/ChatListDrawer';
import { Authenticator, Link, translations } from '@aws-amplify/ui-react';
import { Amplify, I18n } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import useDrawer from './hooks/useDrawer';
import ButtonIcon from './components/ButtonIcon';

import useConversation from './hooks/useConversation';
import LazyOutputText from './components/LazyOutputText';
import useChat from './hooks/useChat';
import SnackbarProvider from './providers/SnackbarProvider';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import './i18n';
import { PrivacyStatement } from './components/PrivacyStatement';

const AuthenticatorComponents = (t: TFunction<"translation">) => ({
  Header: () => (
    <div className="mb-5 mt-10 flex justify-center text-3xl text-aws-font-color">
      {t('app.name')}
    </div>
  )
});

interface AuthenticatorSignOutProps {
  onSignOut: () => void;
  switchDrawer: () => void;
  isGeneratedTitle: boolean;
  title: string;
  onClickNewChat: () => void;
}

const AuthenticatorSignOut: React.FC<AuthenticatorSignOutProps> = ({
  onSignOut,
  switchDrawer,
  isGeneratedTitle,
  title,
  onClickNewChat,
}) => {
  const [privacyStatementOpen, setPrivacyStatementVisibility] = useState(true);

  return (
    <div className='relative flex h-screen w-screen bg-aws-paper'>
      <ChatListDrawer onSignOut={onSignOut} />
      <PrivacyStatement
        isOpen={privacyStatementOpen}
        onClose={() => setPrivacyStatementVisibility(false)}
      />

      <main className='relative min-h-screen flex-1 overflow-y-hidden transition-width'>
        <header className='visible flex h-12 w-full items-center bg-aws-squid-ink p-3 text-lg text-aws-font-color-white lg:hidden lg:h-0'>
          <button
            className='mr-2 rounded-full p-2 hover:brightness-50 focus:outline-none focus:ring-1'
            onClick={switchDrawer}
          >
            <PiList />
          </button>

          <div className='flex grow justify-center'>
            {isGeneratedTitle
              ? <LazyOutputText text={title} />
              : <>{title}</>
            }
          </div>

          <ButtonIcon onClick={onClickNewChat}>
            <PiPlus />
          </ButtonIcon>
        </header>

        <header className='visible flex h-8 w-full items-center bg-cabcookie p-3 text-sm text-aws-font-color-white'>
          <div className='flex grow justify-center'>
            <i>
              Hosted by <Link href='https://about.me/kochcarsten' target='_blank'>Carsten</Link>. I can see your conversations (<Link onClick={() => setPrivacyStatementVisibility(true)}>more details</Link>).
            </i>
          </div>
        </header>

        <div
          className='h-full overflow-hidden overflow-y-auto text-gray-700'
          id='main'
        >
          <SnackbarProvider>
            <Outlet />
          </SnackbarProvider>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t('app.name');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  Amplify.configure({
    Auth: {
      userPoolId: import.meta.env.VITE_APP_USER_POOL_ID,
      userPoolWebClientId: import.meta.env.VITE_APP_USER_POOL_CLIENT_ID,
      authenticationFlowType: 'USER_SRP_AUTH',
    },
  });

  I18n.putVocabularies(translations);
  I18n.setLanguage(i18n.language);

  const { switchOpen: switchDrawer } = useDrawer();
  const navigate = useNavigate();

  const { conversationId } = useParams();
  const { getTitle } = useConversation();
  const { isGeneratedTitle } = useChat();

  const onClickNewChat = useCallback(() => {
    navigate('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Authenticator components={AuthenticatorComponents(t)}>
    {({signOut}) => <AuthenticatorSignOut
      onSignOut={() => {signOut ? signOut() : null}}
      switchDrawer={switchDrawer}
      isGeneratedTitle={isGeneratedTitle}
      onClickNewChat={onClickNewChat}
      title={getTitle(conversationId ?? '')}
    />}
  </Authenticator>
};

export default App;

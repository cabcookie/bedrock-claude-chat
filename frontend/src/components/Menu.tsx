import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from './Button';
import { PiList, PiSignOut, PiStrategyThin, PiTranslate, PiTrash } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import DialogSelectLanguage from './DialogSelectLanguage';
import { BaseProps } from '../@types/common';
import DialogConfirmClearConversations from './DialogConfirmClearConversations';
import useConversation from '../hooks/useConversation';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import useDrawer from '../hooks/useDrawer';

type Props = BaseProps & {
  onSignOut: () => void;
};

// 認証時に表示するメニューコンポーネント
const Menu: React.FC<Props> = (props) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenLangage, setIsOpenLangage] = useState(false);
  const [isOpenClearConversation, setIsOpenClearConversation] = useState(false);
  const { isAdmin } = useUser();
  const { switchOpen: closeDrawer } = useDrawer();

  const { clearConversations: clear } = useConversation();
  const navigate = useNavigate();

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handling when clicking outside of the menu
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClickOutside = (event: any) => {
      // If clicking anything other than the menu button and menu, close the menu.
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    // Set event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Remove event listener in post processing
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  const clearConversations = useCallback(
    () => {
      clear().then(() => {
        navigate('');
        setIsOpenClearConversation(false);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <Button
        ref={buttonRef}
        className="relative bg-aws-squid-ink"
        text
        icon={<PiList />}
        onClick={() => {
          setIsOpen(!isOpen);
        }}>
        {t('button.menu')}
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-10 left-2 w-60 rounded border border-aws-font-color-white bg-aws-sea-blue text-aws-font-color-white"
        >
          {isAdmin && (
            <div
              className='flex w-full cursor-pointer items-center p-2 hover:bg-aws-sea-blue-hover'
              onClick={() => {
                setIsOpen(false);
                closeDrawer();
                navigate('admin');
              }}
            >
              <PiStrategyThin className="mr-2" />
              Admin
            </div>
          )}
          <div
            className="flex w-full cursor-pointer items-center p-2 hover:bg-aws-sea-blue-hover"
            onClick={() => {
              setIsOpen(false);
              setIsOpenLangage(true);
            }}>
            <PiTranslate className="mr-2" />
            {t('button.language')}
          </div>
          <div
            className="flex w-full cursor-pointer items-center p-2 hover:bg-aws-sea-blue-hover"
            onClick={() => {
              setIsOpen(false);
              setIsOpenClearConversation(true);
            }}>
            <PiTrash className="mr-2" />
            {t('button.clearConversation')}
          </div>
          <div
            className="flex w-full cursor-pointer items-center border-t p-2 hover:bg-aws-sea-blue-hover"
            onClick={props.onSignOut}>
            <PiSignOut className="mr-2" />
            {t('button.signOut')}
          </div>
        </div>
      )}

      <DialogSelectLanguage
        isOpen={isOpenLangage}
        onClose={() => {
          setIsOpenLangage(false);
        }}
      />
      <DialogConfirmClearConversations
        isOpen={isOpenClearConversation}
        onClose={() => {
          setIsOpenClearConversation(false);
        }}
        onDelete={clearConversations}
      />
    </>
  );
};

export default Menu;

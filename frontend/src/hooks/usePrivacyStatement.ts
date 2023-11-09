import { create } from "zustand";

const usePrivacyStatementState = create<{
  isShown: boolean;
  setShowState: () => void;
}>((set) => {
  return {
    isShown: false,
    setShowState: () => {
      set((state) => ({
        isShown: !state.isShown,
      }));
    },
  };
});

const usePrivacyStatement = () => {
  const [isShown, setShowState] = usePrivacyStatementState((state) => [
    state.isShown,
    state.setShowState,
  ]);

  return {
    isShown,
    setShowState,
  };
};

export default usePrivacyStatement;

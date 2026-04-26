/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OpenAIOptions = {
  prompt?: string;
};

type AIContextType = {
  isOpen: boolean;
  initialPrompt: string;
  openAI: (options?: OpenAIOptions) => void;
  closeAI: () => void;
};

const AIContext = createContext<AIContextType | undefined>(undefined);

type AIProviderProps = {
  children: ReactNode;
};

export function AIProvider({ children }: AIProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");

  const openAI = useCallback((options?: OpenAIOptions) => {
    setInitialPrompt(options?.prompt ?? "");
    setIsOpen(true);
  }, []);

  const closeAI = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      initialPrompt,
      openAI,
      closeAI,
    }),
    [isOpen, initialPrompt, openAI, closeAI]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }

  return context;
}

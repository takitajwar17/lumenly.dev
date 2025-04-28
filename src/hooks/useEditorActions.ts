import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { AIReview } from "../AIReviewPanel";

interface UseEditorActionsProps {
  code: string;
  language: string;
  setActiveTab: (tab: 'editor' | 'output' | 'review') => void;
}

/**
 * Custom hook to handle editor actions like running code and getting AI review
 */
export function useEditorActions({ code, language, setActiveTab }: UseEditorActionsProps) {
  const [output, setOutput] = useState("");
  const [review, setReview] = useState<AIReview | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isGettingReview, setIsGettingReview] = useState(false);
  const [executionTimestamp, setExecutionTimestamp] = useState<Date | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const executeCode = useAction(api.code.executeCode);
  const getAIAssistance = useAction(api.code.getAIAssistance);

  const handleRunCode = useCallback(async () => {
    if (!code || !language) return;
    
    setIsRunningCode(true);
    setActiveTab('output');
    
    try {
      const result = await executeCode({ language, code });
      setOutput(result.run.output);
      setExecutionTimestamp(new Date());
      setExecutionTime(result.run.time);
    } catch (error) {
      setOutput("Error executing code");
      toast.error("Failed to execute code");
    } finally {
      setIsRunningCode(false);
    }
  }, [code, language, executeCode, setActiveTab]);

  const handleAIAssist = useCallback(async () => {
    if (!code || !language) return;
    
    setIsGettingReview(true);
    setActiveTab('review');
    
    try {
      const response = await getAIAssistance({ code, language });
      // The response is already a JSON string from the backend
      setReview(JSON.parse(response));
    } catch (error) {
      toast.error("Failed to get AI assistance");
      setReview(null);
    } finally {
      setIsGettingReview(false);
    }
  }, [code, language, getAIAssistance, setActiveTab]);

  return {
    output,
    review,
    isRunningCode,
    isGettingReview,
    executionTimestamp,
    executionTime,
    handleRunCode,
    handleAIAssist
  };
} 
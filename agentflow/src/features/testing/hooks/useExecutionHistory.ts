import { useState, useEffect } from 'react';
import { ExecutionHistoryManager } from '@/lib/testing/historyManager';
import { ExecutionContext } from '@/lib/testing/events';

export const useExecutionHistory = () => {
  const [history, setHistory] = useState<ExecutionContext[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  useEffect(() => {
    const historyManager = ExecutionHistoryManager.getInstance();
    historyManager.loadHistory();
    setHistory(historyManager.getHistory());
  }, []);

  return { history, historyVisible, setHistoryVisible, executionHistory: history };
};
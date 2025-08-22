export class ExecutionHistoryManager {
  private static instance: ExecutionHistoryManager;
  private history: ExecutionContext[] = [];

  static getInstance(): ExecutionHistoryManager {
    if (!this.instance) {
      this.instance = new ExecutionHistoryManager();
    }
    return this.instance;
  }

  saveExecution(context: ExecutionContext): void {
    this.history.unshift(context);
    // Keep only last 50 executions
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    // Persist to localStorage
    localStorage.setItem('weev_execution_history', JSON.stringify(this.history));
  }

  getHistory(): ExecutionContext[] {
    return this.history;
  }

  loadHistory(): void {
    const stored = localStorage.getItem('weev_execution_history');
    if (stored) {
      this.history = JSON.parse(stored);
    }
  }
}
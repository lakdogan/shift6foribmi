export interface ContinuationState {
  pendingContinuation: string | null;
  continuationIndent: string;
  pendingTargetIndent: number | null;
}

export interface HandleContinuationResult {
  consumed: boolean;
  producedLines: string[];
  state: ContinuationState;
  splitOccurred: boolean;
}

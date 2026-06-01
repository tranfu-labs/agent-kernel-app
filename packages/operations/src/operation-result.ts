export interface OperationResult<TOutput = unknown> {
  operationId: string;
  status: "completed" | "partial" | "failed";
  output?: TOutput;
  artifactIds: string[];
  warnings: string[];
  errors: string[];
  completedAt: string;
}

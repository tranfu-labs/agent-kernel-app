export interface ExecutionTicket {
  id: string;
  proposalId: string;
  riskCheckId: string;
  confirmationId?: string;
  dryRun: boolean;
  status: "pending" | "approved" | "executing" | "completed" | "partial" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionReceipt<TRequest = unknown, TResponse = unknown> {
  id: string;
  ticketId: string;
  venue: string;
  orderId?: string;
  clientOrderId?: string;
  status: "accepted" | "rejected" | "filled" | "partial" | "cancelled" | "failed";
  requested: TRequest;
  response: TResponse;
  filledQuantity?: number;
  averagePrice?: number;
  fees?: unknown;
  createdAt: string;
}

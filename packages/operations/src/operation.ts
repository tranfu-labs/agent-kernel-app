export type OperationKind =
  | "discover_opportunity"
  | "research_object"
  | "create_trade_proposal"
  | "risk_check"
  | "execute_ticket"
  | "create_watch_plan";

export interface Operation<TInput = unknown> {
  id: string;
  kind: OperationKind;
  name: string;
  input: TInput;
  createdAt: string;
}

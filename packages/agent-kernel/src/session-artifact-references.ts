import type { CrossVenueComparison, Opportunity } from "@agentkernel/domain";

export interface OpportunityArtifactReferenceSource {
  opportunityId: string;
  artifactId?: string;
  symbol?: string;
  title?: string;
}

export interface OpportunityArtifactReference {
  position: number;
  opportunityId: string;
  artifactId: string;
  symbol?: string;
  title?: string;
}

export interface FundingPrepSessionRecord {
  opportunity: Opportunity;
  comparison: CrossVenueComparison;
  artifactId?: string;
}

export interface ResolveOpportunityReferenceResult {
  status: "ok" | "not_found";
  reference: string;
  artifactId?: string;
  opportunityId?: string;
  position?: number;
  symbol?: string;
  title?: string;
  availableReferences: OpportunityArtifactReference[];
  message: string;
}

export class SessionArtifactReferenceStore {
  private references: OpportunityArtifactReference[] = [];
  private prepRecords = new Map<string, FundingPrepSessionRecord>();

  replaceFromOpportunityCards(cards: OpportunityArtifactReferenceSource[]): void {
    this.references = cards
      .filter((card): card is OpportunityArtifactReferenceSource & { artifactId: string } => typeof card.artifactId === "string" && card.artifactId.length > 0)
      .map((card, index) => ({
        position: index + 1,
        opportunityId: card.opportunityId,
        artifactId: card.artifactId,
        symbol: card.symbol,
        title: card.title,
      }));
  }

  replaceFundingPrepRecords(records: FundingPrepSessionRecord[]): void {
    this.prepRecords = new Map(records.flatMap((record) => {
      const keys = [record.artifactId, record.opportunity.id].filter((value): value is string => typeof value === "string" && value.length > 0);
      return keys.map((key) => [key, record] as const);
    }));
  }

  getFundingPrepRecord(reference: string): FundingPrepSessionRecord | undefined {
    const resolved = this.resolve(reference);
    if (resolved.status === "ok" && resolved.artifactId) {
      return this.prepRecords.get(resolved.artifactId) ?? this.prepRecords.get(resolved.opportunityId ?? "");
    }

    return this.prepRecords.get(reference.trim());
  }

  list(): OpportunityArtifactReference[] {
    return [...this.references];
  }

  resolve(reference: string): ResolveOpportunityReferenceResult {
    const normalized = reference.trim().toLowerCase();
    const position = positionFromReference(normalized);
    const match = position !== undefined
      ? this.references.find((item) => item.position === position)
      : this.references.find((item) => item.artifactId.toLowerCase() === normalized
        || item.opportunityId.toLowerCase() === normalized
        || item.symbol?.toLowerCase() === normalized);

    if (!match) {
      return {
        status: "not_found",
        reference,
        availableReferences: this.list(),
        message: "No saved opportunity artifact matched this session reference. Provide an artifact ID or rerun the scanner with artifact saving enabled.",
      };
    }

    return {
      status: "ok",
      reference,
      artifactId: match.artifactId,
      opportunityId: match.opportunityId,
      position: match.position,
      symbol: match.symbol,
      title: match.title,
      availableReferences: this.list(),
      message: `Resolved reference to artifact ID ${match.artifactId}.`,
    };
  }
}

function positionFromReference(reference: string): number | undefined {
  if (/^#?1$/.test(reference) || /first/.test(reference) || /第一个|第一/.test(reference)) return 1;
  if (/^#?2$/.test(reference) || /second/.test(reference) || /第二个|第二/.test(reference)) return 2;
  if (/^#?3$/.test(reference) || /third/.test(reference) || /第三个|第三/.test(reference)) return 3;
  return undefined;
}

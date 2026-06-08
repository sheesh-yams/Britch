/**
 * ProposalStatus — status lifecycle badge.
 */

type Status = "DRAFT" | "SENT" | "VIEWED" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED" | "EXPIRED";

interface ProposalStatusProps {
  status: Status | string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:             { label: "Draft",             color: "var(--paper)",  bg: "var(--ink-3)" },
  SENT:              { label: "Sent",               color: "#fff",          bg: "var(--electric)" },
  VIEWED:            { label: "Viewed",             color: "var(--ink)",    bg: "var(--volt)" },
  APPROVED:          { label: "Approved",           color: "#fff",          bg: "#22c55e" },
  CHANGES_REQUESTED: { label: "Changes Requested",  color: "#fff",          bg: "var(--flush)" },
  REJECTED:          { label: "Rejected",           color: "#fff",          bg: "var(--flush)" },
  EXPIRED:           { label: "Expired",            color: "var(--paper)",  bg: "var(--ink-3)" },
};

export default function ProposalStatus({ status }: ProposalStatusProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "var(--paper)", bg: "var(--ink-3)" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: "var(--r)",
        background: cfg.bg,
        color: cfg.color,
        fontFamily: "var(--font-space-mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      {cfg.label.toUpperCase()}
    </span>
  );
}

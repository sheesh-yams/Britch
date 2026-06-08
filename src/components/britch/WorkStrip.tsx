/**
 * WorkStrip — featured work oEmbed / thumbnail row.
 *
 * Renders a horizontal scrollable strip of work item tiles.
 * Each tile shows an embedded TikTok/Instagram video or a cover thumbnail.
 * Thumbnails are served from R2 (never hotlinked from platform CDNs).
 */

interface WorkItem {
  id:           string;
  title?:       string;
  url?:         string;
  thumbnailKey?: string | null;
  embedHtml?:    string | null;
}

interface WorkStripProps {
  items:     WorkItem[];
  r2BaseUrl: string;  // e.g. https://pub-xxx.r2.dev or empty string
}

export default function WorkStrip({ items, r2BaseUrl }: WorkStripProps) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ display: "flex", gap: 12, width: "max-content" }}>
        {items.map((item) => (
          <WorkTile key={item.id} item={item} r2BaseUrl={r2BaseUrl} />
        ))}
      </div>
    </div>
  );
}

function WorkTile({ item, r2BaseUrl }: { item: WorkItem; r2BaseUrl: string }) {
  const thumbUrl =
    item.thumbnailKey && r2BaseUrl
      ? `${r2BaseUrl}/${item.thumbnailKey}`
      : null;

  return (
    <div
      style={{
        width: 160,
        flexShrink: 0,
        background: "var(--ink-3)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        border: "1.5px solid var(--ink-3)",
      }}
    >
      {/* Thumbnail / embed area */}
      <div
        style={{
          width: "100%",
          height: 200,
          background: "var(--ink-3)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={item.title ?? "Work sample"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--paper)",
              opacity: 0.25,
            }}
          >
            ▶
          </span>
        )}
      </div>

      {/* Title */}
      {item.title && (
        <div
          style={{
            padding: "8px 10px",
            fontFamily: "var(--font-general-sans)",
            fontSize: 12,
            color: "var(--paper)",
            opacity: 0.7,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </div>
      )}
    </div>
  );
}

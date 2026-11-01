import { ArrowUpRight, ImageOff, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Item } from "@/types";

export function ItemCard({ item, backTo }: { item: Item; backTo?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const statusLabels = {
    lost: "Lost",
    found: "Found",
    claimed: "Claim in progress",
    returned: "Returned",
  } as const;
  return (
    <article className="item-card">
      <Link
        className="item-image-link"
        to={`/items/${item.id}`}
        state={backTo ? { from: backTo } : undefined}
        aria-label={`View ${item.title}`}
      >
        {imageFailed ? (
          <span className="item-image-fallback" aria-hidden="true">
            <ImageOff size={23} />
            <span>Image unavailable</span>
          </span>
        ) : (
          <img
            className="item-image"
            src={item.image}
            alt=""
            width={640}
            height={480}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        )}
        <span className={`status-pill status-${item.status}`}>{statusLabels[item.status]}</span>
      </Link>
      <div className="item-card-copy">
        <p className="item-category">{item.category}</p>
        <h3>
          <Link to={`/items/${item.id}`} state={backTo ? { from: backTo } : undefined}>
            {item.title}
          </Link>
        </h3>
        <p className="item-location">
          <MapPin size={14} aria-hidden="true" />
          {item.location}
        </p>
        <div className="item-card-bottom">
          <time dateTime={item.date}>
            {new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>
          <Link
            className="text-link"
            to={`/items/${item.id}`}
            state={backTo ? { from: backTo } : undefined}
            aria-label={`View details for ${item.title}`}
          >
            Details <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

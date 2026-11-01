import * as AvatarPrimitive from "@radix-ui/react-avatar";

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <AvatarPrimitive.Root className={`ui-avatar ui-avatar--${size}`}>
      {src && <AvatarPrimitive.Image className="ui-avatar-image" src={src} alt={name} />}
      <AvatarPrimitive.Fallback className="ui-avatar-fallback" delayMs={0}>
        {initials || "?"}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

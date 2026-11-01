import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

export type TabItem = { value: string; label: string; content: ReactNode };

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
}: {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <TabsPrimitive.Root
      className="ui-tabs"
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
    >
      <TabsPrimitive.List className="ui-tab-list" aria-label="Content sections">
        {items.map((item) => (
          <TabsPrimitive.Trigger className="ui-tab-trigger" key={item.value} value={item.value}>
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content className="ui-tab-panel" key={item.value} value={item.value}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

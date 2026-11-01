import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

type CheckboxProps = {
  id: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  label: string;
};

export function Checkbox({ id, label, ...props }: CheckboxProps) {
  return (
    <div className="ui-check-row">
      <CheckboxPrimitive.Root className="ui-checkbox" id={id} {...props}>
        <CheckboxPrimitive.Indicator>
          <Check size={14} strokeWidth={2.5} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label className="ui-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}

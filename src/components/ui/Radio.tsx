import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

export type RadioOption = { value: string; label: string; disabled?: boolean };

type RadioProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  "aria-label"?: string;
};

export function Radio({ options, ...props }: RadioProps) {
  return (
    <RadioGroupPrimitive.Root className="ui-radio-group" {...props}>
      {options.map((option) => {
        const id = `${props.name ?? "radio"}-${option.value}`;
        return (
          <div className="ui-check-row" key={option.value}>
            <RadioGroupPrimitive.Item
              className="ui-radio"
              id={id}
              value={option.value}
              disabled={option.disabled}
            >
              <RadioGroupPrimitive.Indicator />
            </RadioGroupPrimitive.Item>
            <label className="ui-check-label" htmlFor={id}>
              {option.label}
            </label>
          </div>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}

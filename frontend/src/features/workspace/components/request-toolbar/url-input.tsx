import { TemplateHighlightInput } from "@/components/shared";

type UrlInputProps = {
  value: string;

  onChange: (value: string) => void;
  templateValues: Record<string, string>;

  /**
   * Map of `:name` placeholders to their substitution values. Pass an
   * empty object to enable highlighting without any values yet — the
   * tokens still light up, the hover card just shows them as needing
   * a value.
   */
  pathParamValues: Record<string, string>;
};

export function UrlInput({
  value,
  onChange,
  templateValues,
  pathParamValues,
}: UrlInputProps) {
  return (
    <TemplateHighlightInput
      value={value}
      onChange={onChange}
      placeholder="https://api.example.com/users/:userId"
      className="min-w-0 w-full [&_input]:h-9"
      templateValues={templateValues}
      pathParamValues={pathParamValues}
    />
  );
}

import { TemplateHighlightInput } from "@/components/shared";

type UrlInputProps = {
  value: string;

  onChange: (value: string) => void;
  templateValues: Record<string, string>;
};

export function UrlInput({ value, onChange, templateValues }: UrlInputProps) {
  return (
    <TemplateHighlightInput
      value={value}
      onChange={onChange}
      placeholder="https://api.example.com/users"
      className="w-full"
      templateValues={templateValues}
    />
  );
}

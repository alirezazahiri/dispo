export function buildTemplateValues(
  variables: Array<{ key: string; value: string; enabled: boolean }>,
) {
  return variables.reduce<Record<string, string>>((acc, variable) => {
    const key = variable.key.trim();
    if (variable.enabled && key) {
      acc[key] = variable.value;
    }
    return acc;
  }, {});
}

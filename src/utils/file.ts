export const getFileLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withoutQuery = trimmed.split('?')[0].split('#')[0];
  const parts = withoutQuery.split(/[\\/]/);
  return parts[parts.length - 1] || trimmed;
};

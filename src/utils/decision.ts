export const DANGEROUS_OTHER_OPTION = 'Other';
export const LEGACY_DANGEROUS_OTHER_OPTION = 'Dangerous - Other';

export const parseDecision = (value: string) => {
  if (!value) return { base: '', other: '' };
  if (value.startsWith(DANGEROUS_OTHER_OPTION) || value.startsWith(LEGACY_DANGEROUS_OTHER_OPTION)) {
    const prefix = value.startsWith(DANGEROUS_OTHER_OPTION)
      ? DANGEROUS_OTHER_OPTION
      : LEGACY_DANGEROUS_OTHER_OPTION;
    let other = value.slice(prefix.length).trim();
    if (other.startsWith('-')) other = other.slice(1).trim();
    if (other.startsWith(':')) other = other.slice(1).trim();
    return { base: DANGEROUS_OTHER_OPTION, other };
  }
  return { base: value, other: '' };
};

export const buildDecision = (base: string, other: string) => {
  if (base !== DANGEROUS_OTHER_OPTION) return base;
  const trimmed = other.trim();
  if (!trimmed) return base;
  return `${DANGEROUS_OTHER_OPTION} - ${trimmed}`;
};

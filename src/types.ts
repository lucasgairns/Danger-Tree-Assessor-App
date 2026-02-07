import type { TextInputProps } from 'react-native';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'file';

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
};

export type Step = 'general' | 'tree' | 'lod' | 'lodDetails' | 'decision' | 'summary';

export type LOD = 1 | 2 | 3 | 4;

export type TreeRecord = {
  id: string;
  treeNumber: number;
  dateKey: string;
  tree: Record<string, string>;
  lod: LOD;
  lodChecks: Record<string, boolean>;
  ast?: string;
  rst?: string;
  decision: string;
};

export type TreeRow = {
  treeId: number;
  treeNumber: number;
  dateKey: string;
  species: string | null;
  treeClass: string | null;
  wildlifeValue: string | null;
  treeHeight: string | null;
  diameter: string | null;
  lod: number;
  ast: string | null;
  rst: string | null;
  decision: string;
};

export type IndicatorRow = {
  label: string;
  checked: number;
};

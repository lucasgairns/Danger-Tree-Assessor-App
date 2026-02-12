import type { FieldDef, LOD } from '../types';
import { DANGEROUS_OTHER_OPTION } from '../utils/decision';

export const GENERAL_FIELDS: FieldDef[] = [
  {
    key: 'assessorName',
    label: "Assessor's Name",
    required: true,
    type: 'text',
    autoCapitalize: 'words',
    autoCorrect: false,
  },
  { key: 'date', label: 'Date', required: true, type: 'date' },
  {
    key: 'certificateNumber',
    label: 'Certificate #',
    type: 'number',
    keyboardType: 'numeric',
  },
  { key: 'mapAttached', label: 'Map Attached', type: 'file' },
  {
    key: 'district',
    label: 'District',
    type: 'text',
    autoCapitalize: 'words',
    autoCorrect: false,
  },
  {
    key: 'location',
    label: 'Location',
    type: 'text',
    autoCapitalize: 'words',
    autoCorrect: false,
  },
  {
    key: 'licenseeCp',
    label: 'Licensee/CP',
    type: 'text',
    autoCapitalize: 'words',
    autoCorrect: false,
  },
  {
    key: 'block',
    label: 'Block',
    type: 'text',
    autoCapitalize: 'words',
    autoCorrect: false,
  },
  {
    key: 'activity',
    label: 'Activity',
    type: 'text',
    autoCapitalize: 'words',
    autoCorrect: false,
  },
  { key: 'levelOfDisturbance', label: 'Level of Disturbance', type: 'text' },
  {
    key: 'otherReference',
    label: 'Other Reference',
    type: 'text',
    autoCapitalize: 'sentences',
  },
];

export const TREE_FIELDS: FieldDef[] = [
  {
    key: 'species',
    label: 'Species',
    required: true,
    type: 'text',
    autoCapitalize: 'words',
    autoCorrect: false,
  },
  {
    key: 'treeClass',
    label: 'Tree Class',
    required: true,
    type: 'select',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  },
  {
    key: 'wildlifeValue',
    label: 'Wildlife Value',
    required: true,
    type: 'select',
    options: ['Low', 'Moderate', 'High'],
  },
  {
    key: 'treeHeight',
    label: 'Tree Height (m)',
    required: true,
    type: 'number',
    placeholder: 'm',
  },
  {
    key: 'diameter',
    label: 'Diameter (cm)',
    required: true,
    type: 'number',
    placeholder: 'cm',
  },
];

export const LOD_DANGERS: Record<LOD, string[]> = {
  1: ['Insecurely lodged or hung up limbs/tops', 'Highly unstable tree', 'Recent lean with unstable roots'],
  2: ['Hazardous Top', 'Dead Limbs', "Witches' Broom", 'Split Trunk', 'Stem Damage', 'Thick Sloughing Bark or Sapwood', 'Butt and Stem Cankers', 'Fungal Fruiting Bodies', 'Tree Lean', 'Root Inspection'],
  3: ['Hazardous Top', 'Dead Limbs', "Witches' Broom", 'Split Trunk', 'Stem Damage', 'Thick Sloughing Bark or Sapwood', 'Butt and Stem Cankers', 'Fungal Fruiting Bodies', 'Tree Lean', 'Root Inspection'],
  4: ['Class 1 Tree', 'Class 2 tree with no structural defects', 'Class 2 Cedar with low failture potential', 'Class 3 Conifer with no structural defects', 'None of the above'],
};

export const DECISIONS = [
  'Safe',
  'Dangerous - Fall Tree',
  'Dangerous - Create NWZ',
  DANGEROUS_OTHER_OPTION,
];

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { CheckboxList, RadioGroup } from './src/components/Inputs';
import { DateField, FieldInput, FileField } from './src/components/Fields';
import { deleteTreeRecord, initializeDatabase, persistGeneral, persistTreeRecord, updateTreeRecord } from './src/db/operations';
import { formatDateLabel, formatHeaderDate, toISODate } from './src/utils/date';
import { buildDecision, DANGEROUS_OTHER_OPTION, parseDecision } from './src/utils/decision';
import { buildExportHtml } from './src/utils/export';
import { styles } from './src/styles';
import type { FieldDef, LOD, Step, TreeRecord } from './src/types';
const GENERAL_FIELDS: FieldDef[] = [
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

const TREE_FIELDS: FieldDef[] = [
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

const LOD_DANGERS: Record<LOD, string[]> = {
  1: ['Insecurely lodged or hung up limbs/tops', 'Highly unstable tree', 'Recent lean with unstable roots'],
  2: ['Hazardous Top', 'Dead Limbs', 'Witches\' Broom', 'Split Trunk', 'Stem Damage', 'Thick Sloughing Bark or Sapwood', 'Butt and Stem Cankers', 'Fungal Fruiting Bodies', 'Tree Lean', 'Root Inspection'],
  3: ['Hazardous Top', 'Dead Limbs', 'Witches\' Broom', 'Split Trunk', 'Stem Damage', 'Thick Sloughing Bark or Sapwood', 'Butt and Stem Cankers', 'Fungal Fruiting Bodies', 'Tree Lean', 'Root Inspection'],
  4: ['Class 1 Tree', 'Class 2 tree with no structural defects', 'Class 2 Cedar with low failture potential', 'Class 3 Conifer with no structural defects', 'None of the above'],
};

// TODO: Replace with the four options listed at the end of the attached card.
const DECISIONS = [
  'Safe',
  'Dangerous - Fall Tree',
  'Dangerous - Create NWZ',
  DANGEROUS_OTHER_OPTION,
];

export default function App() {
  const initialDateRef = useRef(new Date());
  const [step, setStep] = useState<Step>('general');
  const [general, setGeneral] = useState<Record<string, string>>(() => ({
    date: '',
  }));
  const [dateValue, setDateValue] = useState<Date>(initialDateRef.current);
  const [tree, setTree] = useState<Record<string, string>>({});
  const [lod, setLod] = useState<LOD | null>(null);
  const [lodChecks, setLodChecks] = useState<Record<string, boolean>>({});
  const [ast, setAst] = useState('');
  const [rst, setRst] = useState('');
  const [decision, setDecision] = useState('');
  const [dangerousOther, setDangerousOther] = useState('');
  const [editingRecord, setEditingRecord] = useState<TreeRecord | null>(null);
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const hasHydrated = useRef(false);
  const initialGeneralFilled = useRef(false);
  const didAutoSummary = useRef(false);

  const requiredGeneral = useMemo(
    () => GENERAL_FIELDS.filter((f) => f.required),
    []
  );
  const requiredTree = useMemo(
    () => TREE_FIELDS.filter((field) => field.required),
    []
  );

  const canContinueGeneral = requiredGeneral.every((f) => (general[f.key] || '').trim() !== '');
  const canContinueTree = requiredTree.every((f) => (tree[f.key] || '').trim() !== '');

  const lod4Selection = useMemo(() => {
    if (lod !== 4) return '';
    return Object.keys(lodChecks).find((label) => lodChecks[label]) ?? '';
  }, [lod, lodChecks]);

  const hasDanger = useMemo(() => {
    if (lod === 4) {
      return Boolean(lodChecks['None of the above']);
    }
    return Object.values(lodChecks).some(Boolean);
  }, [lod, lodChecks]);
  const wildlifeValue = tree.wildlifeValue || '';

  const autoDecision = useMemo(() => {
    if (!hasDanger) return DECISIONS[0];
    if (wildlifeValue === 'High') return DECISIONS[2];
    return DECISIONS[1];
  }, [hasDanger, wildlifeValue]);

  const currentDangerList = lod ? LOD_DANGERS[lod] : [];

  useEffect(() => {
    const hydrate = async () => {
      try {
        const { general: nextGeneral, dateValue: parsedDate, trees: hydratedTrees } =
          await initializeDatabase(initialDateRef.current);
        if (nextGeneral) {
          setGeneral(nextGeneral);
          initialGeneralFilled.current = requiredGeneral.every(
            (field) => (nextGeneral[field.key] || '').trim() !== ''
          );
        }
        if (parsedDate) {
          setDateValue(parsedDate);
        }
        setTrees(hydratedTrees);
        hasHydrated.current = true;
        setDbReady(true);
      } catch (err) {
        Alert.alert('Database error', 'Unable to load saved data.');
      }
    };

    void hydrate();
  }, []);
  useEffect(() => {
    if (!dbReady || !hasHydrated.current) return;

    const persist = async () => {
      try {
        await persistGeneral(general, dateValue);
      } catch (err) {
        Alert.alert('Database error', 'Unable to save general information.');
      }
    };

    void persist();
  }, [dateValue, dbReady, general]);
  useEffect(() => {
    if (!dbReady || !hasHydrated.current) return;
    if (!initialGeneralFilled.current) return;
    if (step !== 'general') return;
    if (didAutoSummary.current) return;
    didAutoSummary.current = true;
    setStep('summary');
  }, [dbReady, step]);

  const setField = (
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    key: string,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (next: Date) => {
    setDateValue(next);
    setField(setGeneral, 'date', formatDateLabel(next));
  };

  const resetTreeFlow = () => {
    setTree({});
    setLod(null);
    setLodChecks({});
    setAst('');
    setRst('');
    setDecision('');
    setDangerousOther('');
    setEditingRecord(null);
  };

  const beginEditRecord = (record: TreeRecord) => {
    const parsed = parseDecision(record.decision);
    setEditingRecord(record);
    setTree({ ...record.tree });
    setLod(record.lod);
    setLodChecks({ ...record.lodChecks });
    setAst(record.ast ?? '');
    setRst(record.rst ?? '');
    setDecision(parsed.base);
    setDangerousOther(parsed.other);
    setStep('tree');
  };

  const handleDeleteRecord = async (record: TreeRecord) => {
    try {
      await deleteTreeRecord(record);
      setTrees((prev) => prev.filter((item) => item.id !== record.id));
      if (editingRecord?.id === record.id) {
        resetTreeFlow();
      }
    } catch (err) {
      Alert.alert('Delete failed', 'Unable to delete this tree record.');
    }
  };

  const handleDecisionContinue = async () => {
    const chosenBase = decision || autoDecision;
    const chosenDecision = buildDecision(chosenBase, dangerousOther);
    await finalizeTree(chosenDecision);
  };

  const finalizeTree = async (chosenDecision: string) => {
    if (!lod) {
      Alert.alert('LOD required', 'Please select a Level of Danger.');
      return;
    }
    const dateKey = editingRecord?.dateKey ?? toISODate(dateValue);
    const treeNumber =
      editingRecord?.treeNumber ??
      trees.filter((record) => record.dateKey === dateKey).length + 1;
    const record: TreeRecord = {
      id: editingRecord?.id ?? '',
      treeNumber,
      dateKey,
      tree,
      lod,
      lodChecks,
      ast: lod === 2 || lod === 3 ? ast : undefined,
      rst: lod === 2 || lod === 3 ? rst : undefined,
      decision: chosenDecision,
    };
    try {
      if (editingRecord) {
        const treePageId = await updateTreeRecord(record);
        const updatedRecord = { ...record, id: String(treePageId) };
        setTrees((prev) => prev.map((item) => (item.id === editingRecord.id ? updatedRecord : item)));
      } else {
        const treePageId = await persistTreeRecord(record);
        const createdRecord = { ...record, id: String(treePageId || record.id || Date.now()) };
        setTrees((prev) => [createdRecord, ...prev]);
      }
    } catch (err) {
      Alert.alert('Database error', 'Unable to save this tree record.');
      return;
    }
    setStep('summary');
    resetTreeFlow();
  };

  const exportForm = async () => {
    if (!trees.length) return;
    const content = await buildExportHtml(general, trees);
    try {
      const result = await Print.printToFileAsync({ html: content });
      const fileUri = result.uri;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: 'Export DTA' });
      } else {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      }
    } catch (err) {
      Alert.alert('Export failed', 'Unable to export the form.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Danger Tree Assessment</Text>
          {general.date ? <Text style={styles.subtitle}>{formatHeaderDate(dateValue)}</Text> : null}
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {step === 'general' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>General Info</Text>
              {GENERAL_FIELDS.map((field) => {
                if (field.type === 'date') {
                  return (
                    <DateField
                      key={field.key}
                      label={field.label}
                      required={field.required}
                      value={dateValue}
                      displayValue={general[field.key] || ''}
                      onChange={handleDateChange}
                    />
                  );
                }

                if (field.type === 'file') {
                  return (
                    <FileField
                      key={field.key}
                      label={field.label}
                      required={field.required}
                      value={general[field.key] || ''}
                      onChange={(value) => setField(setGeneral, field.key, value)}
                    />
                  );
                }

                return (
                  <FieldInput
                    key={field.key}
                    field={field}
                    value={general[field.key] || ''}
                    onChange={(value) => setField(setGeneral, field.key, value)}
                  />
                );
              })}
              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.button, !canContinueGeneral && styles.buttonDisabled]}
                  disabled={!canContinueGeneral}
                  onPress={() => setStep('summary')}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

          {step === 'tree' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Tree Assessment</Text>
              {TREE_FIELDS.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={tree[field.key] || ''}
                  onChange={(value) => setField(setTree, field.key, value)}
                />
              ))}
              <View style={styles.buttonRow}>
                <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => setStep('summary')}>
                  <Text style={styles.buttonText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, !canContinueTree && styles.buttonDisabled]}
                  disabled={!canContinueTree}
                  onPress={() => setStep('lod')}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

        {step === 'lod' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Level of Danger</Text>
            <RadioGroup
              options={[
                { label: 'LOD 1', value: '1' },
                { label: 'LOD 2', value: '2' },
                { label: 'LOD 3', value: '3' },
                { label: 'LOD 4', value: '4' },
              ]}
              value={lod ? String(lod) : ''}
              onChange={(value) => {
                const next = Number(value) as LOD;
                setLod(next);
                setLodChecks({});
              }}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setStep('tree')}
              >
                <Text style={styles.buttonText}>Back</Text>
              </Pressable>
              <Pressable
                style={[styles.button, !lod && styles.buttonDisabled]}
                disabled={!lod}
                onPress={() => setStep('lodDetails')}
              >
                <Text style={styles.buttonText}>Next</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'lodDetails' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Danger Indicators</Text>
            {lod && (
              <View style={styles.group}>
                {lod === 4 ? (
                  <RadioGroup
                    options={currentDangerList.map((label) => ({ label, value: label }))}
                    value={lod4Selection}
                    onChange={(value) => setLodChecks({ [value]: true })}
                  />
                ) : (
                  <CheckboxList
                    options={currentDangerList}
                    values={lodChecks}
                    onChange={(label, checked) =>
                      setLodChecks((prev) => ({ ...prev, [label]: checked }))
                    }
                  />
                )}
              </View>
            )}

            {(lod === 2 || lod === 3) && (
              <View style={styles.group}>
                <FieldInput
                  field={{ key: 'ast', label: 'Actual Stem Thickness', type: 'number' }}
                  value={ast}
                  onChange={setAst}
                />
                <FieldInput
                  field={{ key: 'rst', label: 'Required Stem Thickness', type: 'number' }}
                  value={rst}
                  onChange={setRst}
                />
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => setStep('lod')}>
                <Text style={styles.buttonText}>Back</Text>
              </Pressable>
              <Pressable
                style={[styles.button, !lod && styles.buttonDisabled]}
                disabled={!lod}
                onPress={() => {
                  if (!decision) setDecision(autoDecision);
                  setStep('decision');
                }}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'decision' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Final Decision</Text>
            <Text style={styles.helper}>
              Recommended: {autoDecision} {decision === autoDecision ? '(selected)' : ''}
            </Text>
            <View style={styles.group}>
              {DECISIONS.map((label) => {
                const isOther = label === DANGEROUS_OTHER_OPTION;
                const isSelected = (decision || autoDecision) === label;
                if (isOther) {
                  return (
                    <View key={label} style={styles.otherRow}>
                      <Pressable
                        style={styles.radioRow}
                        onPress={() => {
                          setDecision(label);
                          if (label !== DANGEROUS_OTHER_OPTION) {
                            setDangerousOther('');
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && styles.radioOuterSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.radioLabel}>{label}</Text>
                      </Pressable>
                      <TextInput
                        style={[
                          styles.input,
                          styles.otherInlineInput,
                          !isSelected && styles.inputDisabled,
                        ]}
                        editable={isSelected}
                        value={dangerousOther}
                        onChangeText={setDangerousOther}
                        autoCapitalize="sentences"
                      />
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={label}
                    style={styles.radioRow}
                    onPress={() => {
                      setDecision(label);
                      setDangerousOther('');
                    }}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.buttonRow}>
              <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => setStep('lodDetails')}>
                <Text style={styles.buttonText}>Back</Text>
              </Pressable>
              <Pressable style={[styles.button]} onPress={handleDecisionContinue}>
                <Text style={styles.buttonText}>Finish Tree</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'summary' && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, styles.summarySectionTitle]}>Summary</Text>
            {trees.length === 0 && <Text style={styles.helper}>No trees assessed yet.</Text>}
            {[...trees].reverse().map((record, index) => (
              <Pressable
                key={record.id}
                style={({ pressed }) => [styles.summaryCard, pressed && styles.summaryCardPressed]}
                onPress={() => {
                  Alert.alert(
                    'Tree Actions',
                    `Tree #${record.treeNumber} � ${record.tree.species || '�'}`,
                    [
                      { text: 'Edit', onPress: () => beginEditRecord(record) },
                      { text: 'Delete', style: 'destructive', onPress: () => void handleDeleteRecord(record) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.summaryTitle}>Tree {index + 1}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Species</Text>
                  <Text style={styles.summaryValue}>{record.tree.species || '�'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>LOD</Text>
                  <Text style={styles.summaryValue}>{record.lod}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Decision</Text>
                  <Text style={styles.summaryValue}>{record.decision}</Text>
                </View>
              </Pressable>
            ))}
            <View style={styles.buttonRow}>
              <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => setStep('general')}>
                <Text style={styles.buttonText}>Edit General</Text>
              </Pressable>
              <Pressable
                style={[styles.button]}
                onPress={() => {
                  resetTreeFlow();
                  setStep('tree');
                }}
              >
                <Text style={styles.buttonText}>Assess New Tree</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.button, styles.summaryExportButton, !trees.length && styles.buttonDisabled]}
              disabled={!trees.length}
              onPress={exportForm}
            >
              <Text style={styles.buttonText}>Export Form</Text>
            </Pressable>
          </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { DECISIONS, GENERAL_FIELDS, LOD_DANGERS, TREE_FIELDS } from '../constants/assessment';
import { deleteTreeRecord, initializeDatabase, persistGeneral, persistTreeRecord, updateTreeRecord } from '../db/operations';
import type { LOD, Step, TreeRecord } from '../types';
import { formatDateLabel, toISODate } from '../utils/date';
import { buildDecision, DANGEROUS_OTHER_OPTION, parseDecision } from '../utils/decision';
import { buildExportHtml } from '../utils/export';

type DtaContextValue = {
  step: Step;
  setStep: (step: Step) => void;
  general: Record<string, string>;
  dateValue: Date;
  tree: Record<string, string>;
  lod: LOD | null;
  lodChecks: Record<string, boolean>;
  ast: string;
  rst: string;
  decision: string;
  dangerousOther: string;
  trees: TreeRecord[];
  logbookDateKey: string;
  activeDateKey: string;
  treesForActiveDate: TreeRecord[];
  treesForLogbookDate: TreeRecord[];
  logbookDates: string[];
  logbookCounts: Record<string, number>;
  lod4Selection: string;
  currentDangerList: string[];
  autoDecision: string;
  canContinueGeneral: boolean;
  canContinueTree: boolean;
  generalFields: typeof GENERAL_FIELDS;
  treeFields: typeof TREE_FIELDS;
  decisions: typeof DECISIONS;
  setGeneralField: (key: string, value: string) => void;
  setTreeField: (key: string, value: string) => void;
  setLod: (value: LOD | null) => void;
  setLodChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setAst: (value: string) => void;
  setRst: (value: string) => void;
  setDangerousOther: (value: string) => void;
  setLogbookDateKey: (key: string) => void;
  handleDateChange: (next: Date) => void;
  startNewDay: () => void;
  startTreeAssessment: () => void;
  jumpToDateSummary: (dateKey: string) => void;
  beginEditRecord: (record: TreeRecord) => void;
  deleteRecord: (record: TreeRecord) => Promise<void>;
  continueFromLodDetails: () => void;
  selectDecision: (nextDecision: string) => void;
  finishDecision: () => Promise<void>;
  exportForm: () => Promise<void>;
};

const DtaContext = createContext<DtaContextValue | null>(null);

export function DtaProvider({ children }: { children: React.ReactNode }) {
  const initialDateRef = useRef(new Date());
  const [step, setStep] = useState<Step>('general');
  const [general, setGeneral] = useState<Record<string, string>>(() => ({ date: '' }));
  const [dateValue, setDateValue] = useState<Date>(initialDateRef.current);
  const [tree, setTree] = useState<Record<string, string>>({});
  const [lod, setLodState] = useState<LOD | null>(null);
  const [lodChecks, setLodChecks] = useState<Record<string, boolean>>({});
  const [ast, setAst] = useState('');
  const [rst, setRst] = useState('');
  const [decision, setDecision] = useState('');
  const [dangerousOther, setDangerousOther] = useState('');
  const [editingRecord, setEditingRecord] = useState<TreeRecord | null>(null);
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [logbookDateKey, setLogbookDateKey] = useState('');
  const [dbReady, setDbReady] = useState(false);
  const hasHydrated = useRef(false);
  const initialGeneralFilled = useRef(false);
  const didAutoSummary = useRef(false);

  const requiredGeneral = useMemo(() => GENERAL_FIELDS.filter((f) => f.required), []);
  const requiredTree = useMemo(() => TREE_FIELDS.filter((field) => field.required), []);
  const canContinueGeneral = requiredGeneral.every((f) => (general[f.key] || '').trim() !== '');
  const canContinueTree = requiredTree.every((f) => (tree[f.key] || '').trim() !== '');

  const lod4Selection = useMemo(() => {
    if (lod !== 4) return '';
    return Object.keys(lodChecks).find((label) => lodChecks[label]) ?? '';
  }, [lod, lodChecks]);

  const hasDanger = useMemo(() => {
    if (lod === 4) return Boolean(lodChecks['None of the above']);
    return Object.values(lodChecks).some(Boolean);
  }, [lod, lodChecks]);
  const wildlifeValue = tree.wildlifeValue || '';
  const autoDecision = useMemo(() => {
    if (!hasDanger) return DECISIONS[0];
    if (wildlifeValue === 'High') return DECISIONS[2];
    return DECISIONS[1];
  }, [hasDanger, wildlifeValue]);

  const currentDangerList = lod ? LOD_DANGERS[lod] : [];
  const activeDateKey = useMemo(() => toISODate(dateValue), [dateValue]);
  const treesForActiveDate = useMemo(
    () => trees.filter((record) => record.dateKey === activeDateKey),
    [activeDateKey, trees]
  );
  const treesForLogbookDate = useMemo(
    () => trees.filter((record) => record.dateKey === logbookDateKey),
    [logbookDateKey, trees]
  );
  const logbookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    trees.forEach((record) => {
      counts[record.dateKey] = (counts[record.dateKey] ?? 0) + 1;
    });
    return counts;
  }, [trees]);
  const logbookDates = useMemo(
    () => Object.keys(logbookCounts).sort((a, b) => b.localeCompare(a)),
    [logbookCounts]
  );

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
        if (parsedDate) setDateValue(parsedDate);
        setTrees(hydratedTrees);
        hasHydrated.current = true;
        setDbReady(true);
      } catch {
        Alert.alert('Database error', 'Unable to load saved data.');
      }
    };
    void hydrate();
  }, [requiredGeneral]);

  useEffect(() => {
    if (!dbReady || !hasHydrated.current) return;
    const persist = async () => {
      try {
        await persistGeneral(general, dateValue);
      } catch {
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

  useEffect(() => {
    if (!logbookDates.length) {
      if (logbookDateKey) setLogbookDateKey('');
      return;
    }
    if (!logbookDateKey || !logbookDates.includes(logbookDateKey)) {
      setLogbookDateKey(logbookDates[0]);
    }
  }, [logbookDateKey, logbookDates]);

  const resetTreeFlow = () => {
    setTree({});
    setLodState(null);
    setLodChecks({});
    setAst('');
    setRst('');
    setDecision('');
    setDangerousOther('');
    setEditingRecord(null);
  };

  const setGeneralField = (key: string, value: string) => {
    setGeneral((prev) => ({ ...prev, [key]: value }));
  };

  const setTreeField = (key: string, value: string) => {
    setTree((prev) => ({ ...prev, [key]: value }));
  };

  const setLod = (value: LOD | null) => {
    setLodState(value);
    setLodChecks({});
  };

  const handleDateChange = (next: Date) => {
    setDateValue(next);
    setGeneralField('date', formatDateLabel(next));
  };

  const startNewDay = () => {
    const today = new Date();
    setDateValue(today);
    setGeneral({ date: formatDateLabel(today) });
    setLogbookDateKey(toISODate(today));
    resetTreeFlow();
    setStep('general');
  };

  const startTreeAssessment = () => {
    resetTreeFlow();
    setStep('tree');
  };

  const jumpToDateSummary = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const next = new Date(year, (month || 1) - 1, day || 1);
    setDateValue(next);
    setGeneralField('date', formatDateLabel(next));
    resetTreeFlow();
    setStep('summary');
  };

  const beginEditRecord = (record: TreeRecord) => {
    const parsed = parseDecision(record.decision);
    setEditingRecord(record);
    setTree({ ...record.tree });
    setLodState(record.lod);
    setLodChecks({ ...record.lodChecks });
    setAst(record.ast ?? '');
    setRst(record.rst ?? '');
    setDecision(parsed.base);
    setDangerousOther(parsed.other);
    setStep('tree');
  };

  const deleteRecord = async (record: TreeRecord) => {
    try {
      await deleteTreeRecord(record);
      setTrees((prev) => prev.filter((item) => item.id !== record.id));
      if (editingRecord?.id === record.id) resetTreeFlow();
    } catch {
      Alert.alert('Delete failed', 'Unable to delete this tree record.');
    }
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
    } catch {
      Alert.alert('Database error', 'Unable to save this tree record.');
      return;
    }

    setStep('summary');
    resetTreeFlow();
  };

  const continueFromLodDetails = () => {
    if (!decision) setDecision(autoDecision);
    setStep('decision');
  };

  const selectDecision = (nextDecision: string) => {
    setDecision(nextDecision);
    if (nextDecision !== DANGEROUS_OTHER_OPTION) {
      setDangerousOther('');
    }
  };

  const finishDecision = async () => {
    const chosenBase = decision || autoDecision;
    const chosenDecision = buildDecision(chosenBase, dangerousOther);
    await finalizeTree(chosenDecision);
  };

  const exportForm = async () => {
    if (!treesForActiveDate.length) return;
    const content = await buildExportHtml(general, treesForActiveDate);
    try {
      const result = await Print.printToFileAsync({ html: content });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Export DTA' });
      } else {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      }
    } catch {
      Alert.alert('Export failed', 'Unable to export the form.');
    }
  };

  const value: DtaContextValue = {
    step,
    setStep,
    general,
    dateValue,
    tree,
    lod,
    lodChecks,
    ast,
    rst,
    decision,
    dangerousOther,
    trees,
    logbookDateKey,
    activeDateKey,
    treesForActiveDate,
    treesForLogbookDate,
    logbookDates,
    logbookCounts,
    lod4Selection,
    currentDangerList,
    autoDecision,
    canContinueGeneral,
    canContinueTree,
    generalFields: GENERAL_FIELDS,
    treeFields: TREE_FIELDS,
    decisions: DECISIONS,
    setGeneralField,
    setTreeField,
    setLod,
    setLodChecks,
    setAst,
    setRst,
    setDangerousOther,
    setLogbookDateKey,
    handleDateChange,
    startNewDay,
    startTreeAssessment,
    jumpToDateSummary,
    beginEditRecord,
    deleteRecord,
    continueFromLodDetails,
    selectDecision,
    finishDecision,
    exportForm,
  };

  return <DtaContext.Provider value={value}>{children}</DtaContext.Provider>;
}

export function useDta() {
  const ctx = useContext(DtaContext);
  if (!ctx) {
    throw new Error('useDta must be used within DtaProvider');
  }
  return ctx;
}

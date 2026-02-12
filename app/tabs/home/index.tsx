import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateField, FieldInput, FileField } from '../../../src/components/Fields';
import { CheckboxList, RadioGroup } from '../../../src/components/Inputs';
import { useDta } from '../../../src/state/DtaContext';
import { styles } from '../../../src/styles';
import type { LOD } from '../../../src/types';
import { DANGEROUS_OTHER_OPTION } from '../../../src/utils/decision';

export default function HomeScreen() {
  const {
    step,
    setStep,
    general,
    dateValue,
    activeDateKey,
    tree,
    lod,
    lodChecks,
    lod4Selection,
    currentDangerList,
    ast,
    rst,
    decision,
    dangerousOther,
    autoDecision,
    canContinueGeneral,
    canContinueTree,
    treesForActiveDate,
    generalFields,
    treeFields,
    decisions,
    handleDateChange,
    setGeneralField,
    setTreeField,
    startNewDay,
    startTreeAssessment,
    setLod,
    setLodChecks,
    setAst,
    setRst,
    selectDecision,
    setDangerousOther,
    continueFromLodDetails,
    finishDecision,
    exportForm,
    beginEditRecord,
    deleteRecord,
  } = useDta();

  const orderedTrees = [...treesForActiveDate].sort((a, b) => a.treeNumber - b.treeNumber);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.dayCard}>
          <Text style={styles.sectionTitle}>Home</Text>
          <Text style={styles.helper}>Active day: {activeDateKey}</Text>
          <Text style={styles.helper}>Trees for this day: {treesForActiveDate.length}</Text>
          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={startNewDay}>
              <Text style={styles.buttonText}>Start New Day</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={startTreeAssessment}>
              <Text style={styles.buttonText}>Assess Tree</Text>
            </Pressable>
          </View>
        </View>

        {step === 'general' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>General Info</Text>
            {generalFields.map((field) => {
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
                    onChange={(value) => setGeneralField(field.key, value)}
                  />
                );
              }
              return (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={general[field.key] || ''}
                  onChange={(value) => setGeneralField(field.key, value)}
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
            {treeFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={tree[field.key] || ''}
                onChange={(value) => setTreeField(field.key, value)}
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
              onChange={(value) => setLod(Number(value) as LOD)}
            />
            <View style={styles.buttonRow}>
              <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => setStep('tree')}>
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
            {lod ? (
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
                    onChange={(label, checked) => {
                      setLodChecks((prev) => ({ ...prev, [label]: checked }));
                    }}
                  />
                )}
              </View>
            ) : null}

            {lod === 2 || lod === 3 ? (
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
            ) : null}

            <View style={styles.buttonRow}>
              <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => setStep('lod')}>
                <Text style={styles.buttonText}>Back</Text>
              </Pressable>
              <Pressable
                style={[styles.button, !lod && styles.buttonDisabled]}
                disabled={!lod}
                onPress={continueFromLodDetails}
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
              {decisions.map((label) => {
                const isOther = label === DANGEROUS_OTHER_OPTION;
                const isSelected = (decision || autoDecision) === label;
                if (isOther) {
                  return (
                    <View key={label} style={styles.otherRow}>
                      <Pressable style={styles.radioRow} onPress={() => selectDecision(label)}>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                          {isSelected ? <View style={styles.radioInner} /> : null}
                        </View>
                        <Text style={styles.radioLabel}>{label}</Text>
                      </Pressable>
                      <TextInput
                        style={[styles.input, styles.otherInlineInput, !isSelected && styles.inputDisabled]}
                        editable={isSelected}
                        value={dangerousOther}
                        onChangeText={setDangerousOther}
                        autoCapitalize="sentences"
                      />
                    </View>
                  );
                }

                return (
                  <Pressable key={label} style={styles.radioRow} onPress={() => selectDecision(label)}>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
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
              <Pressable style={styles.button} onPress={() => void finishDecision()}>
                <Text style={styles.buttonText}>Finish Tree</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'summary' && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, styles.summarySectionTitle]}>Summary</Text>
            {orderedTrees.length === 0 ? (
              <Text style={styles.helper}>No trees assessed for this day.</Text>
            ) : null}
            {orderedTrees.map((record) => (
              <Pressable
                key={record.id}
                style={({ pressed }) => [styles.summaryCard, pressed && styles.summaryCardPressed]}
                onPress={() => {
                  Alert.alert(
                    'Tree Actions',
                    `Tree #${record.treeNumber} - ${record.tree.species || '-'}`,
                    [
                      { text: 'Edit', onPress: () => beginEditRecord(record) },
                      { text: 'Delete', style: 'destructive', onPress: () => void deleteRecord(record) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={styles.summaryTitle}>Tree {record.treeNumber}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Species</Text>
                  <Text style={styles.summaryValue}>{record.tree.species || '-'}</Text>
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
              <Pressable style={styles.button} onPress={startTreeAssessment}>
                <Text style={styles.buttonText}>Assess New Tree</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.button, styles.summaryExportButton, !orderedTrees.length && styles.buttonDisabled]}
              disabled={!orderedTrees.length}
              onPress={() => void exportForm()}
            >
              <Text style={styles.buttonText}>Export Form</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

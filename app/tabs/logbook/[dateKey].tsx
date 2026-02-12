import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useDta } from '../../../src/state/DtaContext';
import { styles } from '../../../src/styles';

export default function LogbookDaySummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dateKey?: string | string[] }>();
  const {
    trees,
    setLogbookDateKey,
    jumpToDateSummary,
  } = useDta();

  const dateKeyParam = Array.isArray(params.dateKey) ? params.dateKey[0] : params.dateKey;
  const dateKey = dateKeyParam || '';

  useEffect(() => {
    if (!dateKey) return;
    setLogbookDateKey(dateKey);
  }, [dateKey, setLogbookDateKey]);

  const orderedTrees = useMemo(
    () =>
      trees
        .filter((record) => record.dateKey === dateKey)
        .sort((a, b) => a.treeNumber - b.treeNumber),
    [dateKey, trees]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, styles.summarySectionTitle]}>Day Summary</Text>
        {!dateKey ? (
          <Text style={styles.helper}>No day selected.</Text>
        ) : null}
        {dateKey && orderedTrees.length === 0 ? (
          <Text style={styles.helper}>No trees recorded for this day.</Text>
        ) : null}
        {orderedTrees.map((record) => (
          <View key={record.id} style={styles.summaryCard}>
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
          </View>
        ))}
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              router.replace('/tabs/logbook');
            }}
          >
            <Text style={styles.buttonText}>Back to Logbook</Text>
          </Pressable>
          <Pressable
            style={[styles.button, !dateKey && styles.buttonDisabled]}
            disabled={!dateKey}
            onPress={() => {
              if (!dateKey) return;
              jumpToDateSummary(dateKey);
              router.push('/tabs/home');
            }}
          >
            <Text style={styles.buttonText}>Open In Home</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

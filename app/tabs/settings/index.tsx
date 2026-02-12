import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useDta } from '../../../src/state/DtaContext';
import { styles } from '../../../src/styles';

export default function SettingsScreen() {
  const { logbookDates, trees } = useDta();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Text style={styles.helper}>Appearance and preferences will live here.</Text>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Active DB</Text>
          <Text style={styles.settingsValue}>Local SQLite</Text>
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Days Logged</Text>
          <Text style={styles.settingsValue}>{logbookDates.length}</Text>
        </View>
        <View style={styles.settingsRow}>
          <Text style={styles.settingsLabel}>Total Trees</Text>
          <Text style={styles.settingsValue}>{trees.length}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

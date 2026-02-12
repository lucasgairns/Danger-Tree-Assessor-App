import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useDta } from '../../../src/state/DtaContext';
import { styles } from '../../../src/styles';

export default function LogbookScreen() {
  const router = useRouter();
  const { logbookDates, logbookDateKey, logbookCounts, setLogbookDateKey } = useDta();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Logbook</Text>
        {logbookDates.length === 0 ? (
          <Text style={styles.helper}>No days logged yet.</Text>
        ) : (
          logbookDates.map((dateKey) => {
            const selected = dateKey === logbookDateKey;
            return (
              <Pressable
                key={dateKey}
                style={[styles.logbookRow, selected && styles.logbookRowActive]}
                onPress={() => {
                  setLogbookDateKey(dateKey);
                  router.push(`/tabs/logbook/${dateKey}`);
                }}
              >
                <Text style={styles.logbookDate}>{dateKey}</Text>
                <Text style={styles.logbookMeta}>{logbookCounts[dateKey] ?? 0} trees</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

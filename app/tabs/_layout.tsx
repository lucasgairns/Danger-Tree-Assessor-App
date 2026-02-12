import { Ionicons } from '@expo/vector-icons';
import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

import { useDta } from '../../src/state/DtaContext';
import { styles } from '../../src/styles';
import { formatHeaderDate } from '../../src/utils/date';

type TabKey = 'home' | 'logbook' | 'settings';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { dateValue, general, logbookDateKey } = useDta();

  const activeTab: TabKey = pathname.includes('/tabs/logbook')
    ? 'logbook'
    : pathname.includes('/tabs/settings')
      ? 'settings'
      : 'home';

  const headerTitle =
    activeTab === 'logbook'
      ? logbookDateKey
        ? `Logbook: ${logbookDateKey}`
        : 'Logbook'
      : activeTab === 'settings'
        ? 'Settings'
        : 'Danger Tree Assessment';

  const headerSubtitle =
    activeTab === 'home' && general.date ? formatHeaderDate(dateValue) : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{headerTitle}</Text>
        {headerSubtitle ? <Text style={styles.subtitle}>{headerSubtitle}</Text> : null}
      </View>

      <View style={styles.flex}>
        <Slot />
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}
          onPress={() => router.replace('/tabs/home')}
        >
          <Ionicons
            name="home-outline"
            size={18}
            color={activeTab === 'home' ? '#1E5128' : '#6B7280'}
          />
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'logbook' && styles.tabButtonActive]}
          onPress={() => router.replace('/tabs/logbook')}
        >
          <Ionicons
            name="book-outline"
            size={18}
            color={activeTab === 'logbook' ? '#1E5128' : '#6B7280'}
          />
          <Text style={[styles.tabLabel, activeTab === 'logbook' && styles.tabLabelActive]}>Logbook</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
          onPress={() => router.replace('/tabs/settings')}
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={activeTab === 'settings' ? '#1E5128' : '#6B7280'}
          />
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

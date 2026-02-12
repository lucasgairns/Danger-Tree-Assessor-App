import { Slot } from 'expo-router';
import React from 'react';

import { DtaProvider } from '../src/state/DtaContext';

export default function RootLayout() {
  return (
    <DtaProvider>
      <Slot />
    </DtaProvider>
  );
}

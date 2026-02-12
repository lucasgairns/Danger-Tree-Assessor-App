import { withLayoutContext } from 'expo-router';
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import type { StackNavigationOptions, StackNavigationEventMap } from '@react-navigation/stack';

const { Navigator } = createStackNavigator();

const JsStack = withLayoutContext<
  StackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  StackNavigationEventMap
>(Navigator);

export default function LogbookLayout() {
  return (
    <JsStack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    />
  );
}

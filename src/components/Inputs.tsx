import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { styles } from '../styles';

export type RadioOption = { label: string; value: string };

export const RadioGroup = ({
  options,
  value,
  onChange,
}: {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <View style={styles.group}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={styles.radioRow}
          onPress={() => onChange(option.value)}
        >
          <View style={[styles.radioOuter, value === option.value && styles.radioOuterSelected]}>
            {value === option.value && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
};

export const CheckboxList = ({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: Record<string, boolean>;
  onChange: (label: string, checked: boolean) => void;
}) => {
  return (
    <View>
      {options.map((label) => {
        const checked = Boolean(values[label]);
        return (
          <Pressable
            key={label}
            style={styles.checkboxRow}
            onPress={() => onChange(label, !checked)}
          >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

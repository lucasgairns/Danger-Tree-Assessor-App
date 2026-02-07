import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';

import { styles } from '../styles';
import type { FieldDef } from '../types';
import { getFileLabel } from '../utils/file';

type FieldInputProps = {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
};

export const FieldInput = ({ field, value, onChange }: FieldInputProps) => {
  if (field.type === 'select' && field.options) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>
          {field.label}
          {field.required ? ' *' : ''}
        </Text>
        <View style={styles.optionRow}>
          {field.options.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.optionChip,
                value === option && styles.optionChipSelected,
              ]}
              onPress={() => onChange(option)}
            >
              <Text
                style={[
                  styles.optionText,
                  value === option && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {field.label}
        {field.required ? ' *' : ''}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={field.placeholder}
        keyboardType={field.keyboardType ?? (field.type === 'number' ? 'numeric' : 'default')}
        autoCapitalize={field.autoCapitalize}
        autoCorrect={field.autoCorrect}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
};

export const DateField = ({
  label,
  required,
  value,
  displayValue,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: Date;
  displayValue: string;
  onChange: (value: Date) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPicker = () => {
    setDraft(value);
    setOpen(true);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <Pressable style={styles.input} onPress={openPicker}>
        <Text style={[styles.inputText, !displayValue && styles.inputPlaceholder]}>
          {displayValue || 'MM/DD/YYYY'}
        </Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.dateModalCard} onPress={() => {}}>
            <Text style={styles.subsectionTitle}>Select Date</Text>
            <DateTimePicker
              value={draft}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={(event, selected) => {
                if (Platform.OS === 'android') {
                  if (event.type === 'set' && selected) {
                    onChange(selected);
                  }
                  setOpen(false);
                  return;
                }
                if (selected) setDraft(selected);
              }}
            />

            {Platform.OS === 'ios' && (
              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setOpen(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.button}
                  onPress={() => {
                    onChange(draft);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.buttonText}>Done</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export const FileField = ({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) => {
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onChange(asset.uri ?? asset.name ?? '');
      }
    } catch (err) {
      Alert.alert('Upload failed', 'Unable to attach the file.');
    }
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <View style={styles.fileRow}>
        <Pressable style={styles.fileButton} onPress={pickFile}>
          <Text style={styles.fileButtonText}>{value ? 'Change File' : 'Upload File'}</Text>
        </Pressable>
        {value ? (
          <Pressable style={styles.fileRemoveButton} onPress={() => onChange('')}>
            <Text style={styles.fileRemoveButtonText}>Remove</Text>
          </Pressable>
        ) : null}
        <Text style={styles.fileName} numberOfLines={1}>
          {value ? getFileLabel(value) : 'No file selected'}
        </Text>
      </View>
    </View>
  );
};

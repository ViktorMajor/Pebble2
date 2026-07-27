import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { deletePebbleAccount } from './lifecycleService';

export function AccountDeletionButton() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const deleteAccount = async () => {
    setIsDeleting(true);
    setErrorText(null);

    try {
      await deletePebbleAccount();
    } catch {
      setErrorText('Could not delete account.');
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'Your profile, memberships, sent pebbles, invitations, and device tokens will be removed. The other person\'s profile and pebbles remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => void deleteAccount() },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={isDeleting}
        onPress={confirmDelete}
        style={[styles.button, isDeleting && styles.disabled]}
      >
        {isDeleting ? <ActivityIndicator color="#8B3F35" /> : <Text style={styles.text}>Delete account</Text>}
      </Pressable>
      {errorText ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#8B3F35',
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: '#8B3F35',
    fontSize: 13,
    textAlign: 'center',
  },
});

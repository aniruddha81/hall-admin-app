import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from 'react-native';

import { GradientHeader } from '@/components/gradient-header';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme';
import { getApiErrorMessage } from '@/lib/api';
import { formatLabel } from '@/lib/roles';
import { changePassword, updateProfile, uploadAvatar } from '@/lib/services/auth.service';

async function pickImage(source: 'camera' | 'library') {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow camera access to take a profile photo.');
      return null;
    }
    return ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', 'Allow photo library access to choose a profile picture.');
    return null;
  }
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });
}

export default function ProfileScreen() {
  const { user, logout, refreshProfile, setUser } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const uploadFromUri = async (uri: string) => {
    setUploadingAvatar(true);
    setError(null);
    try {
      const res = await uploadAvatar(uri);
      if (user) {
        setUser({ ...user, avatarUrl: res.data.avatarUrl });
      } else {
        await refreshProfile();
      }
      Alert.alert('Saved', 'Profile picture updated successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const choosePhotoSource = () => {
    const openCamera = async () => {
      const result = await pickImage('camera');
      if (!result || result.canceled || !result.assets[0]) return;
      await uploadFromUri(result.assets[0].uri);
    };

    const openLibrary = async () => {
      const result = await pickImage('library');
      if (!result || result.canceled || !result.assets[0]) return;
      await uploadFromUri(result.assets[0].uri);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take photo', 'Choose from library'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void openCamera();
          if (index === 2) void openLibrary();
        },
      );
      return;
    }

    Alert.alert('Profile photo', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take photo', onPress: () => void openCamera() },
      { text: 'Choose from library', onPress: () => void openLibrary() },
    ]);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshProfile();
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setSaving(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Saved', 'Password changed successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const metaChips = [
    formatLabel(user?.designation),
    formatLabel(user?.hall),
    user?.operationalUnit ? formatLabel(user.operationalUnit) : null,
    user?.academicDepartment,
  ].filter(Boolean) as string[];

  const header = (
    <GradientHeader extraBottom={28}>
      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <Avatar
            name={user?.name}
            uri={user?.avatarUrl}
            size={60}
            uploading={uploadingAvatar}
            onPress={choosePhotoSource}
          />
          {!uploadingAvatar ? (
            <View style={[styles.cameraBadge, { borderRadius: radius.full, backgroundColor: colors.surface }]}>
              <MaterialIcons name="photo-camera" size={14} color={colors.primary} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle" style={styles.name} numberOfLines={1}>
            {user?.name ?? 'Admin'}
          </ThemedText>
          <ThemedText type="small" style={styles.email} numberOfLines={1}>
            {user?.email ?? ''}
          </ThemedText>
        </View>
      </View>
      <View style={styles.chipsRow}>
        {metaChips.map((c) => (
          <View key={c} style={[styles.metaChip, { borderRadius: radius.full }]}>
            <ThemedText type="small" style={styles.metaChipText}>
              {c}
            </ThemedText>
          </View>
        ))}
      </View>
    </GradientHeader>
  );

  return (
    <Screen header={header} overlap={20}>
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}14`, borderColor: `${colors.error}30` }]}>
          <ThemedText type="small" style={{ color: colors.error }}>{error}</ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Personal Details" />
      <View style={[styles.formGroup, { gap: spacing.md }]}>
        <Input label="Name" icon="person" value={name} onChangeText={setName} />
        <Input label="Phone" icon="call" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Button title="Save Personal Details" loading={saving} onPress={saveProfile} style={styles.btn} />
      </View>

      <SectionHeader title="Security & Login" />
      <View style={[styles.formGroup, { gap: spacing.md }]}>
        <Input label="Current Password" icon="lock" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter active password" />
        <Input label="New Password" icon="lock-reset" secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" />
        <Button title="Update Password" variant="secondary" loading={saving} onPress={savePassword} style={styles.btn} />
      </View>

      <SectionHeader title="Preferences & Account" />
      <View style={[styles.menuPanel, { gap: spacing.xs }]}>
        <ListRow
          icon="tune"
          accent={colors.secondary}
          title="Settings & Appearance"
          subtitle="System, light, dark, and session management"
          showChevron
          onPress={() => router.push('/(app)/settings')}
        />
        <ListRow
          icon="logout"
          accent={colors.error}
          title="Sign Out"
          subtitle="Sign out from this mobile device"
          onPress={logout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  name: { color: '#FFFFFF', marginTop: -2 },
  email: { color: 'rgba(255,255,255,0.75)' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaChipText: { color: '#FFFFFF', fontWeight: '600', fontSize: 11.5 },
  formGroup: { marginBottom: 8 },
  btn: { marginTop: 4 },
  menuPanel: {},
  errorBox: { padding: 14, borderRadius: 12, borderWidth: 1 },
});

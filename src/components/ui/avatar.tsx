import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { resolveRemoteImageUrl } from '@/lib/media';

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

type AvatarProps = {
  name?: string | null;
  uri?: string | null;
  size?: number;
  onPress?: () => void;
  uploading?: boolean;
};

export function Avatar({ name, uri, size = 56, onPress, uploading }: AvatarProps) {
  const { colors, typography } = useTheme();
  const borderRadius = size / 2;
  const imageUri = resolveRemoteImageUrl(uri);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  const gradientColors = [colors.primary, colors.secondary, colors.tertiary] as const;

  const content =
    imageUri && !imageFailed ? (
      <Image
        source={{ uri: imageUri }}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={imageUri}
        onError={() => setImageFailed(true)}
        accessibilityLabel={name ? `${name} profile photo` : 'Profile photo'}
      />
    ) : (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, { width: size, height: size, borderRadius }]}>
        <Text style={[styles.label, { fontSize: size * 0.36, fontFamily: typography.fonts.sans }]}>
          {initials(name)}
        </Text>
      </LinearGradient>
    );

  const avatar = (
    <View style={{ width: size, height: size }}>
      {content}
      {uploading ? (
        <View style={[styles.overlay, { width: size, height: size, borderRadius }]}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return avatar;

  return (
    <Pressable
      onPress={onPress}
      disabled={uploading}
      accessibilityRole="button"
      accessibilityLabel="Change profile photo"
      style={({ pressed }) => [{ opacity: pressed || uploading ? 0.85 : 1 }]}>
      {avatar}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
});

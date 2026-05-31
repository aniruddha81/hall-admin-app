import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setRootBackgroundColor } from '@/lib/safe-system-ui';
import { useTheme } from '@/theme';

type TabIconName = React.ComponentProps<typeof MaterialIcons>['name'];

function TabBarIcon({ name, focused, color }: { name: TabIconName; focused: boolean; color: any }) {
  const { colors, radius } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.18, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [focused, scaleAnim]);

  const pillBg = focused ? `${colors.primary}1f` : 'transparent';

  return (
    <Animated.View
      style={[styles.iconContainer, { backgroundColor: pillBg, borderRadius: radius.full, transform: [{ scale: scaleAnim }] }]}>
      <MaterialIcons name={name} size={22} color={color} />
    </Animated.View>
  );
}

function TabBarBackground({ resolvedTheme, colors }: { resolvedTheme: 'light' | 'dark'; colors: ReturnType<typeof useTheme>['colors'] }) {
  if (Platform.OS === 'ios') {
    return (
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <BlurView tint={resolvedTheme === 'dark' ? 'dark' : 'light'} intensity={75} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceGlass }]} />
      </View>
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />;
}

export default function TabLayout() {
  const { colors, resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom;
  const tabBarHeight = 56 + bottomInset;

  // Transparent Android nav bar shows the window background; match tab bar color.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void setRootBackgroundColor(colors.tabBar);

    return () => {
      void setRootBackgroundColor(colors.background);
    };
  }, [colors.background, colors.tabBar]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: bottomInset,
        },
        tabBarItemStyle: { height: 52, paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
        tabBarBackground: () => <TabBarBackground resolvedTheme={resolvedTheme} colors={colors} />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="dashboard" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="notifications" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: 'Work',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="work" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="person" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
});

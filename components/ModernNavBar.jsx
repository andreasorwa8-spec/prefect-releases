// components/ModernNavBar.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors, shadows } from '../lib/theme';

const TABS = [
  { name: 'Home', route: '/student/home', icon: 'H' },
  { name: 'Classes', route: '/student/timetable', icon: 'T' },
  { name: 'Wallet', route: '/wallet', icon: 'W' },
  { name: 'Chat', route: '/chat', icon: 'C' },
  { name: 'Profile', route: '/profile', icon: 'P' },
];

export default function ModernNavBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.route;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => router.push(tab.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                <Text style={[styles.iconText, isActive && styles.iconTextActive]}>
                  {tab.icon}
                </Text>
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '100%',
    justifyContent: 'space-between',
    ...shadows.card,
    shadowOpacity: 0.15,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: colors.navyBase,
    transform: [{ translateY: -15 }],
    shadowColor: colors.navyBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  iconTextActive: {
    color: colors.bgMain,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.navyBase,
    fontWeight: '700',
  },
});
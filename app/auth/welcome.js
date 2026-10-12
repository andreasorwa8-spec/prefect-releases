import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';

const ROLES = [
  {
    value: 'STUDENT',
    letter: 'S',
    label: 'Student',
    hint: 'Enrolled in a course',
  },
  {
    value: 'LECTURER',
    letter: 'L',
    label: 'Lecturer',
    hint: 'Teaching at an institution',
  },
  {
    value: 'OTHER',
    letter: 'E',
    label: 'Explore Prefect',
    hint: 'Stay in the loop',
  },
];

export default function Welcome() {
  function pickRole(role) {
    router.push({ pathname: '/auth/signup', params: { role } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradientTop} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/brand/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Headline */}
        <View style={styles.rule} />
        <Text style={styles.headline}>Join as</Text>

        {/* Role cards */}
        <View style={styles.roles}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={styles.card}
              onPress={() => pickRole(role.value)}
              activeOpacity={0.7}
            >
              <View style={styles.monogram}>
                <Text style={styles.monogramText}>{role.letter}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>{role.label}</Text>
                <Text style={styles.cardHint}>{role.hint}</Text>
              </View>
              <Text style={styles.cardChevron}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign in link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/signin')} activeOpacity={0.7}>
            <Text style={styles.footerLink}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F5',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: '#EEF2FA',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
  },
  rule: {
    width: 40,
    height: 3,
    backgroundColor: '#C9A961',
    marginBottom: 20,
    alignSelf: 'center',
  },
  headline: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1B2A4E',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 44,
  },
  roles: {
    gap: 14,
    marginBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    shadowColor: '#1B2A4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  monogram: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1B2A4E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  monogramText: {
    color: '#C9A961',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B2A4E',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 13,
    color: '#8A93A5',
    lineHeight: 18,
  },
  cardChevron: {
    fontSize: 22,
    color: '#C9A961',
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    color: '#6B7383',
    fontSize: 14,
  },
  footerLink: {
    color: '#1B2A4E',
    fontSize: 14,
    fontWeight: '700',
  },
});
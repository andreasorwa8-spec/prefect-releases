import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('email');
  const [error, setError] = useState('');

  async function requestLink() {
    if (!email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.post('/api/auth/mobile/request', { email: email.toLowerCase() });
      setStage('sent');
    } catch (err) {
      setError(err.message || 'Unable to send link');
    } finally {
      setBusy(false);
    }
  }

  async function verifyToken() {
    if (!token.trim()) {
      setError('Enter the code from your email');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api.post('/api/auth/mobile/verify', { token: token.trim() });
      if (data.sessionToken) {
        await signIn(data);
        const role = data.user?.role;
        if (role === 'LECTURER') router.replace('/lecturer/home');
        else if (role === 'DEPARTMENT') router.replace('/department/home');
        else if (role === 'MERCHANT') router.replace('/merchant/home');
        else if (role === 'ADMIN') router.replace('/admin');
        else if (role === 'OTHER') router.replace('/other/home');
        else router.replace('/student/home');
      } else {
        setError(data.error || 'Unable to verify');
      }
    } catch (err) {
      setError(err.message || 'Unable to verify');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.gradientTop} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => (stage === 'email' ? router.back() : setStage('email'))}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/brand/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {stage === 'email' ? (
          <>
            <View style={styles.rule} />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue to Prefect.</Text>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor="#9AA2B1"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              editable={!busy}
              returnKeyType="go"
              onSubmitEditing={requestLink}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              onPress={requestLink}
              disabled={busy}
              style={[styles.button, busy && styles.buttonDisabled]}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#F8F7F5" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Prefect?</Text>
              <TouchableOpacity onPress={() => router.replace('/auth/welcome')} activeOpacity={0.7}>
                <Text style={styles.footerLink}> Create account</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.rule} />
            <Text style={styles.title}>Check your inbox</Text>
            <Text style={styles.subtitle}>
              A secure link has been sent to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <View style={styles.notice}>
              <View style={styles.noticeDot} />
              <Text style={styles.noticeText}>Valid for 15 minutes</Text>
            </View>

            <Text style={styles.label}>Sign-in code</Text>
            <TextInput
              value={token}
              onChangeText={setToken}
              placeholder="Paste code here"
              placeholderTextColor="#9AA2B1"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, styles.tokenInput]}
              editable={!busy}
              multiline
              textAlignVertical="top"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              onPress={verifyToken}
              disabled={busy}
              style={[styles.button, busy && styles.buttonDisabled]}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#F8F7F5" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setStage('email')}
              style={styles.resendButton}
              activeOpacity={0.7}
            >
              <Text style={styles.resendText}>
                Didn't receive it? <Text style={styles.resendAccent}>Try again</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    height: 240,
    backgroundColor: '#EEF2FA',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    marginBottom: 24,
  },
  backText: {
    fontSize: 20,
    color: '#1B2A4E',
    fontWeight: '500',
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
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1B2A4E',
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7383',
    lineHeight: 22,
    marginBottom: 36,
  },
  emailHighlight: {
    color: '#1B2A4E',
    fontWeight: '600',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    marginBottom: 24,
  },
  noticeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9A961',
    marginRight: 10,
  },
  noticeText: {
    color: '#6B7383',
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B2A4E',
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    color: '#14192B',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    marginBottom: 24,
  },
  tokenInput: {
    minHeight: 100,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  button: {
    backgroundColor: '#1B2A4E',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#1B2A4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#F8F7F5',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  error: {
    color: '#A93B3B',
    fontSize: 13,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    color: '#6B7383',
    fontSize: 14,
  },
  resendAccent: {
    color: '#1B2A4E',
    fontWeight: '700',
  },
});
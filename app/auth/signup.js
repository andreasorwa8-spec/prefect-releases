import { useState, useEffect } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const ROLES = [
  { value: 'STUDENT', label: 'Student', hint: 'Enrolled in a course' },
  { value: 'LECTURER', label: 'Lecturer', hint: 'Teaching at an institution' },
  { value: 'OTHER', label: 'Just browsing', hint: 'Buy, explore, stay in the loop' },
];

export default function SignUp() {
  const { signIn } = useAuth();
  const params = useLocalSearchParams();
  const [role, setRole] = useState(params.role || 'STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('form');
  const [error, setError] = useState('');
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  useEffect(() => {
    if (params.role && ['STUDENT', 'LECTURER', 'OTHER'].includes(params.role)) {
      setRole(params.role);
    }
  }, [params.role]);

  const selectedRole = ROLES.find((r) => r.value === role);
  const isStudent = role === 'STUDENT';
  const isOther = role === 'OTHER';

  async function submit() {
    setError('');
    if (!email.includes('@')) return setError('Enter a valid email address');

    if (isOther) {
      setBusy(true);
      try {
        await api.post('/api/auth/mobile/request', { email: email.toLowerCase() });
        setStage('sent');
      } catch (err) {
        setError(err.message || 'Unable to send link');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!name.trim()) return setError('Enter your full name');
    if (!departmentCode.trim()) return setError('Enter your department code');
    if (!inviteCode.trim()) return setError('Enter your invite code');
    if (isStudent && !admissionNumber.trim()) return setError('Enter your admission number');

    setBusy(true);
    try {
      await api.post('/api/auth/mobile/signup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        departmentCode: departmentCode.trim().toUpperCase(),
        inviteCode: inviteCode.trim(),
        admissionNumber: isStudent ? admissionNumber.trim().toUpperCase() : null,
      });
      setStage('sent');
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setBusy(false);
    }
  }

  async function verifyToken() {
    if (!token.trim()) return setError('Enter the code from your email');
    setBusy(true);
    setError('');
    try {
      const data = await api.post('/api/auth/mobile/verify', { token: token.trim() });
      if (data.sessionToken) {
        await signIn(data);
        const r = data.user?.role;
        if (r === 'LECTURER') router.replace('/lecturer/home');
        else if (r === 'DEPARTMENT') router.replace('/department/home');
        else if (r === 'MERCHANT') router.replace('/merchant/home');
        else if (r === 'ADMIN') router.replace('/admin');
        else if (r === 'OTHER') router.replace('/other/home');
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
          onPress={() => (stage === 'form' ? router.back() : setStage('form'))}
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

        {stage === 'form' ? (
          <>
            {/* Header */}
            <View style={styles.rule} />
            <Text style={styles.title}>Join Prefect</Text>
            <Text style={styles.subtitle}>
              Create your account in under a minute.
            </Text>

            {/* Role dropdown */}
            <Text style={styles.label}>I am a</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setRolePickerOpen(true)}
              disabled={busy}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownText}>{selectedRole?.label}</Text>
                <Text style={styles.dropdownHint}>{selectedRole?.hint}</Text>
              </View>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>

            {/* Full name — hidden for Other */}
            {!isOther && (
              <>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Andy Orwa"
                  placeholderTextColor="#9AA2B1"
                  style={styles.input}
                  editable={!busy}
                />
              </>
            )}

            {/* Email */}
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
            />

            {/* Admission number — students only */}
            {isStudent && (
              <>
                <Text style={styles.label}>Admission number</Text>
                <TextInput
                  value={admissionNumber}
                  onChangeText={setAdmissionNumber}
                  placeholder="ENG/2024/0042"
                  placeholderTextColor="#9AA2B1"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.input}
                  editable={!busy}
                />
              </>
            )}

            {/* Department + invite — Student and Lecturer only */}
            {!isOther && (
              <>
                <Text style={styles.label}>Department code</Text>
                <TextInput
                  value={departmentCode}
                  onChangeText={setDepartmentCode}
                  placeholder="ENG"
                  placeholderTextColor="#9AA2B1"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.input}
                  editable={!busy}
                />

                <Text style={styles.label}>Invite code</Text>
                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder={isStudent ? 'STU-ENG-2026S1' : 'LEC-ENG-2026S1'}
                  placeholderTextColor="#9AA2B1"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.input}
                  editable={!busy}
                />
              </>
            )}

            {/* Notice for Other */}
            {isOther && (
              <View style={styles.notice}>
                <View style={styles.noticeDot} />
                <Text style={styles.noticeText}>
                  We&apos;ll send a magic link — no password needed.
                </Text>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* CTA */}
            <TouchableOpacity
              onPress={submit}
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

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/auth/signin')} activeOpacity={0.7}>
                <Text style={styles.footerLink}> Sign in</Text>
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
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Role picker modal */}
        <Modal
          visible={rolePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setRolePickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setRolePickerOpen(false)}
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select your role</Text>
              <FlatList
                data={ROLES}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setRole(item.value);
                      setRolePickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemText}>{item.label}</Text>
                      <Text style={styles.modalItemHint}>{item.hint}</Text>
                    </View>
                    {role === item.value && (
                      <Text style={styles.modalCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
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
    marginBottom: 20,
  },
  backText: {
    fontSize: 20,
    color: '#1B2A4E',
    fontWeight: '500',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
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
    marginBottom: 32,
  },
  emailHighlight: {
    color: '#1B2A4E',
    fontWeight: '600',
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
    paddingVertical: 17,
    color: '#14192B',
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    marginBottom: 22,
  },
  tokenInput: {
    minHeight: 100,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#14192B',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownHint: {
    color: '#8A93A5',
    fontSize: 12,
    marginTop: 3,
  },
  chevron: {
    color: '#6B7383',
    fontSize: 16,
    marginLeft: 12,
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
    marginBottom: 22,
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
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(27,42,78,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0DCD3',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B2A4E',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1B2A4E',
    fontWeight: '600',
  },
  modalItemHint: {
    fontSize: 12,
    color: '#8A93A5',
    marginTop: 3,
  },
  modalCheck: {
    color: '#C9A961',
    fontSize: 18,
    fontWeight: '700',
  },
});
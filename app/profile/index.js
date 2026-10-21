import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api, ApiError, API_URL } from '@/lib/api';
import { getMobileSession } from '@/lib/auth';

const BIO_MAX = 280;
const NAME_MAX = 80;

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/profile');
      setProfile(res.self || null);
      setName(res.self?.name || '');
      setBio(res.self?.bio || '');
      setAvatarUrl(res.self?.avatarUrl || null);
    } catch (err) {
      setError(err?.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function pickAvatar() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to pick an avatar.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setBusy(true); setError('');
      try {
        const session = await getMobileSession();
        const uri = asset.uri || asset.localUri;
        if (!uri) {
          setError('No image URI returned by picker');
          return;
        }
        const name = asset.fileName && String(asset.fileName).length > 0
          ? asset.fileName
          : ('avatar_' + Date.now() + '.jpg');
        const mime = asset.mimeType && String(asset.mimeType).length > 0
          ? asset.mimeType
          : 'image/jpeg';

        // RN fetch supports file:// on Android and returns a Blob.
        // Bypasses expo-file-system deprecation AND the { uri, name, type }
        // FormData serialization that RN 0.76+ (Fabric/bridgeless) rejects.
        const fileResp = await fetch(uri);
        const rawBlob = await fileResp.blob();
        console.log('AVATAR_RAW_BLOB_SIZE=' + rawBlob.size);
        console.log('AVATAR_RAW_BLOB_TYPE=' + JSON.stringify(rawBlob.type));

        // RN's fetch(uri).blob() returns a blob with empty .type.
        // Rebuild with the correct MIME so the backend multipart parser
        // sees image/jpeg (or image/png / image/webp / image/gif).
        const blob = new Blob([rawBlob], { type: mime });
        console.log('AVATAR_TYPED_BLOB_SIZE=' + blob.size);
        console.log('AVATAR_TYPED_BLOB_TYPE=' + JSON.stringify(blob.type));

        const form = new FormData();
        form.append('file', blob, name);

        const resp = await fetch(API_URL + '/api/chat/upload', {
          method: 'POST',
          headers: session?.sessionToken ? { 'X-Session-Token': session.sessionToken } : {},
          body: form,
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.url) {
          setError(data?.error || 'Upload failed');
          return;
        }
        setAvatarUrl(data.url);
      } finally {
        setBusy(false);
      }
    } catch (err) {
      setError(err?.message || 'Pick failed');
    }
  }

  async function save() {
    setBusy(true); setError(''); setSavedAt(null);
    try {
      const res = await api.patch('/api/profile', {
        name,
        bio,
        avatarUrl: avatarUrl || '',
      });
      setProfile((cur) => ({ ...cur, ...(res.self || {}) }));
      setSavedAt(new Date());
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  const avatarUri = avatarUrl
    ? (avatarUrl.startsWith('http') ? avatarUrl : API_URL + avatarUrl)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1B2A4E" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(name || profile?.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarBtns}>
              <TouchableOpacity style={styles.avatarBtn} onPress={pickAvatar} disabled={busy}>
                <Text style={styles.avatarBtnText}>{avatarUrl ? 'Change photo' : 'Upload photo'}</Text>
              </TouchableOpacity>
              {avatarUrl ? (
                <TouchableOpacity onPress={() => setAvatarUrl(null)} style={styles.avatarRemove}>
                  <Text style={styles.avatarRemoveText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={NAME_MAX}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
            <Text style={styles.counter}>{name.length}/{NAME_MAX}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              maxLength={BIO_MAX}
              placeholder="A short intro"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.textarea]}
              multiline
            />
            <Text style={styles.counter}>{bio.length}/{BIO_MAX}</Text>
          </View>

          <View style={styles.metaBox}>
            <Text style={styles.metaLine}>Email: <Text style={styles.metaValue}>{profile?.email}</Text></Text>
            <Text style={styles.metaLine}>Role: <Text style={styles.metaValue}>{profile?.role}</Text></Text>
            {profile?.admissionNumber ? (
              <Text style={styles.metaLine}>Admission: <Text style={styles.metaValue}>{profile.admissionNumber}</Text></Text>
            ) : null}
            {profile?.department ? (
              <Text style={styles.metaLine}>Department: <Text style={styles.metaValue}>{profile.department.name} ({profile.department.code})</Text></Text>
            ) : null}
          </View>

          <View style={styles.linkRow}>
            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/terms')}>
              <Text style={styles.linkText}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/chat')}>
              <Text style={styles.linkText}>Chat</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {savedAt ? <Text style={styles.savedText}>Saved {savedAt.toLocaleTimeString()}</Text> : null}

          <TouchableOpacity
            style={[styles.saveBtn, busy && styles.saveBtnDisabled]}
            onPress={save}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{busy ? 'Saving...' : 'Save changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EFE9DA', backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22, color: '#1B2A4E', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1B2A4E' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#F4EFE2',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarFallbackText: { fontSize: 36, color: '#1B2A4E', fontWeight: '700' },
  avatarBtns: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' },
  avatarBtn: {
    backgroundColor: '#1B2A4E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  avatarBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  avatarRemove: { paddingHorizontal: 8, paddingVertical: 6 },
  avatarRemoveText: { color: '#6B7280', fontSize: 12 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#1B2A4E', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#EFE9DA',
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, color: '#1B2A4E',
  },
  textarea: { minHeight: 84, textAlignVertical: 'top' },
  counter: { fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  metaBox: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginVertical: 12,
    borderWidth: 1, borderColor: '#EFE9DA',
  },
  metaLine: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  metaValue: { color: '#1B2A4E', fontWeight: '600' },
  linkRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  linkBtn: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EFE9DA',
  },
  linkText: { color: '#1B2A4E', fontSize: 13, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#1B2A4E', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  errorText: { color: '#991B1B', fontSize: 12, marginTop: 10, textAlign: 'center' },
  savedText: { color: '#166534', fontSize: 12, marginTop: 10, textAlign: 'center' },
});

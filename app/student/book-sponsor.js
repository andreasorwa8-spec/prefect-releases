import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { colors } from '../../lib/theme';
import { api } from '../../lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function BookSponsor() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(100);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!image) return Alert.alert("Error", "Please select an image.");
    setLoading(true);
    
    try {
      const formData = new FormData();
      const filename = image.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      
      // FIXED: Standard string concatenation instead of template literal
      const type = match ? "image/" + match[1] : "image/jpeg";
      
      formData.append('file', { uri: image, name: filename, type: type });

      const uploadRes = await api.post('/api/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const modRes = await api.post('/api/sponsor/moderate', { imageUrl: uploadRes.url });
      
      if (modRes.success) {
        Alert.alert("Approved!", "Your image passed the AI quality check. Proceeding to payment.");
      } else {
        Alert.alert("Rejected by AI", modRes.error);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to process image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Book Sponsored Billboard</Text>
      
      <Text style={styles.sectionTitle}>1. Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarRow}>
        {DAYS.map(day => (
          <TouchableOpacity 
            key={day} 
            style={[styles.dayBtn, selectedDay === day && styles.dayBtnActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>2. Choose Audience</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity style={styles.roleBtn} onPress={() => setPrice(100)}>
          <Text style={styles.roleTitle}>Students Only</Text>
          <Text style={styles.rolePrice}>\/day</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roleBtn} onPress={() => setPrice(300)}>
          <Text style={styles.roleTitle}>All Roles (Global)</Text>
          <Text style={styles.rolePrice}>\/day</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>3. Upload Image (16:9)</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <Text style={styles.uploadText}>Tap to select image</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.hintText}>AI will automatically reject vulgar, low-quality, or inappropriate images.</Text>

      <TouchableOpacity style={styles.payBtn} onPress={handleUpload} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payBtnText}>Review & Pay \</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMain, padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  calendarRow: { flexDirection: 'row', marginBottom: 10 },
  dayBtn: { padding: 15, borderRadius: 12, backgroundColor: colors.bgCard, marginRight: 10, borderWidth: 1, borderColor: colors.borderLight },
  dayBtnActive: { backgroundColor: colors.navyDark, borderColor: colors.navyDark },
  dayText: { color: colors.textSecondary, fontWeight: '600' },
  dayTextActive: { color: colors.bgMain },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderLight },
  roleTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rolePrice: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  uploadBox: { height: 200, backgroundColor: colors.bgCard, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.borderLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadText: { color: colors.textSecondary, fontWeight: '600' },
  hintText: { fontSize: 12, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
  payBtn: { backgroundColor: '#F97316', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const Donateus = () => {
  const navigation = useNavigation();

  // UPI Payment Link
  const donateNow = () => {
    const upiUrl =
      'upi://pay?pa=mshameer260-2@okicici&pn=LysernFy&am=50&cu=INR';
    Linking.openURL(upiUrl);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Donate Us</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Ionicons name="heart" size={48} color="#ef4444" style={{ marginBottom: 14 }} />

        <Text style={styles.heading}>Support Our Work ❤️</Text>
        <Text style={styles.subtitle}>
          Your contribution helps us maintain and improve the app, add new features,
          and keep the service running.
        </Text>

        {/* Donation Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why Donate?</Text>
          <Text style={styles.cardDesc}>
            Every donation, big or small, helps us grow and deliver a better
            experience for everyone.
          </Text>
        </View>

        {/* Donate Now Button */}
        <TouchableOpacity style={styles.donateBtn} onPress={donateNow}>
          <Ionicons name="heart-outline" size={22} color="#fff" />
          <Text style={styles.donateText}>Donate via UPI</Text>
        </TouchableOpacity>

        {/* OR Separator */}
        <Text style={styles.orText}>OR</Text>

        {/* QR Code */}
        <Text style={styles.qrHeading}>Scan QR to Donate</Text>
        <Image
          source={require('../assets/qr.jpeg')} // your QR image here
          style={styles.qr}
        />
        <Text style={styles.qrText}>
          Scan with Google Pay / PhonePe / Paytm / Amazon Pay
        </Text>
      </View>

    </ScrollView>
  )
}

export default Donateus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  heading: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 30,
  },
  cardTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  donateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginBottom: 20,
  },
  donateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  orText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 14,
  },
  qrHeading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  qr: {
    width: 200,
    height: 250,
    marginBottom: 12,
    borderRadius:12,
  },
  qrText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 20,
  },
})

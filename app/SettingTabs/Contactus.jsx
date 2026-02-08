import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'

const Contactus = () => {
  const navigation = useNavigation();

  const emailUs = () => {
    Linking.openURL('mailto:mshameer1227@gmail.com');
  }

  const callUs = () => {
    Linking.openURL('tel:+916374089031');
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info */}
      <Text style={styles.subtitle}>
        We’d love to hear from you. Reach out anytime.
      </Text>

      {/* Contact Options */}
      <TouchableOpacity style={styles.card} onPress={emailUs}>
        <Ionicons name="mail-outline" size={22} color="#fff" />
        <View style={styles.textWrap}>
          <Text style={styles.cardTitle}>Email Us</Text>
          <Text style={styles.cardDesc}>mshameer1227@gmail.com</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={callUs}>
        <Ionicons name="call-outline" size={22} color="#fff" />
        <View style={styles.textWrap}>
          <Text style={styles.cardTitle}>Call Us</Text>
          <Text style={styles.cardDesc}>+91 63740 89031</Text>
        </View>
      </TouchableOpacity>

      {/* Optional Note */}
      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
        <Text style={styles.noteText}>
          Our support team usually responds within 24 hours.
        </Text>
      </View>

    </View>
  )
}

export default Contactus

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 14,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  cardDesc: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 20,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
  },
  noteText: {
    color: '#9CA3AF',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
})

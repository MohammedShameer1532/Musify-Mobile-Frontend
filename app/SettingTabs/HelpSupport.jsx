import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'

const HelpSupport = () => {
  const navigation = useNavigation();

  const emailSupport = () => {
    Linking.openURL('mailto:mshameer1227@gmail.com');
  }

  const callSupport = () => {
    Linking.openURL('tel:+916374089031');
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <Text style={styles.subtitle}>
        We’re here to help you with anything you need
      </Text>

      {/* Quick Help */}
      <Text style={styles.sectionTitle}>Quick Help</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How to delete my account?</Text>
        <Text style={styles.cardDesc}>
          Go to Settings → Account Details → Delete Account.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How to change my username?</Text>
        <Text style={styles.cardDesc}>
          Go to Settings → Profile Edit, then update your username and save changes.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How do I check my account details?</Text>
        <Text style={styles.cardDesc}>
          Go to Settings → Account Details to view your information.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How do I contact support?</Text>
        <Text style={styles.cardDesc}>
          You can contact support from Settings by selecting Connect With Us.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Why is my app not loading?</Text>
        <Text style={styles.cardDesc}>
          Check your internet connection or try restarting the app.
        </Text>
      </View>

      {/* Contact Support */}
      <Text style={styles.sectionTitle}>Contact Support</Text>

      <TouchableOpacity style={styles.card} onPress={emailSupport}>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={22} color="#fff" />
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>Email Support</Text>
            <Text style={styles.cardDesc}>
              Send us an email and we’ll get back to you.
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cards} onPress={callSupport}>
        <View style={styles.row}>
          <Ionicons name="call-outline" size={22} color="#fff" />
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>Call Support</Text>
            <Text style={styles.cardDesc}>
              Talk directly with our support team.
            </Text>
          </View>
        </View>
      </TouchableOpacity>

    </ScrollView>
  )
}

export default HelpSupport

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#E5E7EB',
  },
  card: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cards: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 16,
    marginBottom: 60,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  cardDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textWrap: {
    flex: 1,
  },
})

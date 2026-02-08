import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient' // install react-native-linear-gradient

const SocialLink = ({ navigation }) => {
  const links = [
    { title: 'Twitter', icon: 'logo-twitter', url: 'https://x.com/mshameer260', color: '#1DA1F2' },
    { title: 'Instagram', icon: 'logo-instagram', url: 'https://www.instagram.com/mshameer260/', color: '#E1306C' },
    { title: 'LinkedIn', icon: 'logo-linkedin', url: 'https://www.linkedin.com/in/mohammed-shameer-a-60454623b/', color: '#0077B5' },
    { title: 'GitHub', icon: 'logo-github', url: 'https://github.com/MohammedShameer1532', color: '#333' },
    { title: 'Facebook', icon: 'logo-facebook', url: 'https://www.facebook.com/a.mdshameer.a.mdshameer', color: '#1877F2' },
    { title: 'YouTube', icon: 'logo-youtube', url: 'https://www.youtube.com/@MohammedShameer1527', color: '#FF0000' },
  ]

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={['#1f1f1f', '#121212']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect With Us</Text>
      </LinearGradient>

      {/* Social Links */}
      <View style={styles.cardWrap}>
        {links.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: link.color }]}
            onPress={() => Linking.openURL(link.url)}
          >
            <Ionicons name={link.icon} size={24} color={link.color} style={styles.cardIcon} />
            <Text style={styles.cardText}>{link.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default SocialLink

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  cardWrap: {
    marginTop: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 3,
    borderLeftWidth: 4, // brand accent stripe
  },
  cardIcon: {
    marginRight: 14,
  },
  cardText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

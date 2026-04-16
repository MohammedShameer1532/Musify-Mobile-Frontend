// ShareScreenSimple.js
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ShareScreenSimple() {
  const navigation = useNavigation();

  const onShare = async () => {
    try {
      const result = await Share.share({
        title: 'Check out MyApp',
        message:
          'I use MyApp to listen to music. Try it: https://example.com/app-link',
        url: 'https://example.com/app-link',
        // Android may show this separately
      });
      // result.action === Share.sharedAction or Share.dismissedAction
    } catch (error) {
      console.log('Share error', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>share</Text>
        <View style={{ width: 40 }} />
      </View>
      <View className='pl-10 pr-10 mt-20'>
        <TouchableOpacity style={styles.button} onPress={onShare}>
          <Text style={styles.buttonText}>Share App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
    marginTop: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1, padding: 2, backgroundColor: '#050505' },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,

  },
  buttonText: { color: '#fff', fontWeight: '700' },
});

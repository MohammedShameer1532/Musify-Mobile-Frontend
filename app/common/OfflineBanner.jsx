import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import useNetwork from '../contextProvider/networkContext';

const OfflineBanner = () => {
  const isConnected = useNetwork();

  if (isConnected) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(58,134,255,0.95)', 'rgba(29,53,87,0.95)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        <Video
          source={require('../assets/wifi.mp4')}
          style={styles.video}
          resizeMode="contain"
          repeat
          muted
          controls={false}
        />

        <View style={{flex: 1}}>
          <Text style={styles.title}>Offline Mode Enabled</Text>

          <Text style={styles.message}>
            Access your Library to enjoy downloaded tracks 🎵
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default OfflineBanner;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
    zIndex: 9999,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 24,
    elevation: 10,
  },

  video: {
    width: 65,
    height: 65,
    marginRight: 12,
  },

  title: {
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  message: {
    fontFamily: 'Poppins-Medium',
    color: '#D8E6FF',
    fontSize: 13,
    marginTop: 3,
  },
});
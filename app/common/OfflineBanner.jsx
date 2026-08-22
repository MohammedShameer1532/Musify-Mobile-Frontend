import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useNetwork from '../contextProvider/networkContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OfflineBanner = () => {
  const isConnected = useNetwork();

  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const entranceAnim = React.useRef(new Animated.Value(0)).current; // 0 -> hidden, 1 -> shown
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const wasOffline = React.useRef(false);

  // Icon pulse loop while offline
  React.useEffect(() => {
    let animation;
    if (isConnected === false) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    }
    return () => animation?.stop();
  }, [isConnected, pulseAnim]);

  // Shimmer sweep across the icon, looping while offline
  React.useEffect(() => {
    let animation;
    if (isConnected === false) {
      shimmerAnim.setValue(0);
      animation = Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    }
    return () => animation?.stop();
  }, [isConnected, shimmerAnim]);

  // Slide + fade entrance/exit whenever offline status changes
  React.useEffect(() => {
    if (isConnected === false) {
      wasOffline.current = true;
      Animated.spring(entranceAnim, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else if (isConnected === true && wasOffline.current) {
      Animated.timing(entranceAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        wasOffline.current = false;
      });
    }
  }, [isConnected, entranceAnim]);

  // Network status still resolving, or genuinely online with no prior offline state
  if (isConnected === null) return null;
  if (isConnected === true && !wasOffline.current) return null;

  const translateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, 70],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          opacity: entranceAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Outer glow */}
      <View style={styles.glow} />

      <LinearGradient
        colors={['#0B1120', '#111C3A', '#0B1120']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Animated top accent line */}
        <LinearGradient
          colors={['#38BDF8', '#818CF8', '#C084FC', '#38BDF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accent}
        />

        {/* Icon container */}
        <Animated.View
          style={[
            styles.iconWrapper,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#2563EB', '#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBackground}
          >
            <Video
              source={require('../assets/wifi.mp4')}
              style={styles.video}
              resizeMode="contain"
              repeat
              muted
              controls={false}
            />

            {/* Shimmer sweep overlay */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerOverlay,
                { transform: [{ translateX: shimmerTranslate }, { rotate: '20deg' }] },
              ]}
            />
          </LinearGradient>

          {/* Offline dot */}
          <View style={styles.offlineDot}>
            <View style={styles.offlineDotInner} />
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>You're Offline</Text>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>OFFLINE</Text>
            </View>
          </View>

          <Text style={styles.message}>No internet connection right now</Text>

          <View style={styles.libraryRow}>
            <View style={styles.musicIcon}>
              <Ionicons name="musical-notes" size={12} color="#A5B4FC" />
            </View>

            <Text style={styles.libraryText}>
              Your downloaded music is still available
            </Text>
          </View>
        </View>

        {/* Decorative icon */}
        <View style={styles.signalIcon}>
          <Ionicons
            name="cloud-offline-outline"
            size={20}
            color="rgba(255,255,255,0.55)"
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default OfflineBanner;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 58,
    left: 14,
    right: 14,
    zIndex: 99999,
  },

  glow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: -6,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    opacity: 0.22,
    transform: [{ scale: 1.03 }],
  },

  card: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',

    paddingLeft: 12,
    paddingRight: 14,
    paddingVertical: 13,

    borderRadius: 24,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',

    overflow: 'hidden',

    elevation: 14,

    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },

  accent: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2.5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },

  iconWrapper: {
    width: 62,
    height: 62,
    marginRight: 12,
    position: 'relative',
  },

  iconBackground: {
    width: 62,
    height: 62,
    borderRadius: 20,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',

    overflow: 'hidden',
  },

  video: {
    width: 54,
    height: 54,
  },

  shimmerOverlay: {
    position: 'absolute',
    width: 22,
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  offlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,

    width: 20,
    height: 20,

    borderRadius: 10,

    backgroundColor: '#0B1120',

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: '#1E3A8A',
  },

  offlineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  content: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  title: {
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
    marginRight: 8,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 10,

    backgroundColor: 'rgba(239,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F87171',
    marginRight: 4,
  },

  statusText: {
    fontFamily: 'Poppins-Bold',
    color: '#FCA5A5',
    fontSize: 8,
    letterSpacing: 0.5,
  },

  message: {
    fontFamily: 'Poppins-Medium',
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 17,
  },

  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  musicIcon: {
    width: 19,
    height: 19,
    borderRadius: 6,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(99,102,241,0.2)',

    marginRight: 6,
  },

  libraryText: {
    flex: 1,

    fontFamily: 'Poppins-Medium',
    color: '#A5B4FC',
    fontSize: 10.5,
    lineHeight: 15,
  },

  signalIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.06)',

    marginLeft: 4,
  },
});
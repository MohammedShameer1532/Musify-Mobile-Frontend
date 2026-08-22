import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Musiclang from './Musiclang';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  NativeModules,
} from 'react-native';
import Equilizer from './Equilizer';


const { width } = Dimensions.get('window'); // ✅ screen width
const SONG_IMAGE_SIZE = Math.min(
  width * 0.62,
  320
);

const BASE_WIDTH = 360;

const scale = (size) => (width / BASE_WIDTH) * size;

const General = () => {
  const navigation = useNavigation();
  const { EqualizerModule } = NativeModules;

  function AnimatedIcon({ children, focused }) {
    const scale = new Animated.Value(focused ? 1.15 : 1);
    const opacity = new Animated.Value(focused ? 1 : 0.7);

    useEffect(() => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: focused ? 1.15 : 1,
          useNativeDriver: true,
          friction: 5,
        }),
        Animated.timing(opacity, {
          toValue: focused ? 1 : 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, [focused]);

    return (
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        {children}
      </Animated.View>
    );
  }

  return (
    <LinearGradient colors={['#050505', '#0b0b0b']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={scale(22)} color="white" />
            </TouchableOpacity>
          <Text style={styles.title}>General Settings</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingVertical: 12, paddingBottom: 110, }} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate(Musiclang)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#6d28d9']}
              style={styles.iconContainer}
            >
              <MaterialIcons name="language" color="#fff" size={22} />
            </LinearGradient>

            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>
                Music Language
              </Text>

              <Text style={styles.optionSubtitle}>
                Select your Music language
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#666"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate(Equilizer)}
          >
            <LinearGradient
              colors={['#8b5cf6', '#6d28d9']}
              style={styles.iconContainer}
            >
              <Ionicons name="options-outline" color="#fff" size={22} />
            </LinearGradient>

            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>
                Equalizer
              </Text>

              <Text style={styles.optionSubtitle}>
                Customize sound
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#666"
            />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient >
  )
}

export default General

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  backBtn: {
    width: scale(35),
    height: scale(35),
    borderRadius: scale(20),

    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    color: '#fff',
    fontSize: scale(20),
    fontFamily: 'Poppins-Bold',
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.05)',

    paddingVertical: 15,
    paddingHorizontal: 14,

    borderRadius: 22,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 14,
  },

  optionTitle: {
    color: '#fff',
    fontSize: scale(15),
    fontFamily: 'Poppins-Bold',
  },

  optionSubtitle: {
    color: '#8f8f8f',
    fontSize: scale(12),
    marginTop: 3,
    fontFamily: 'Poppins-Medium',
  },
  optionTextWrap: {
    flex: 1,
  },
  btn: {
    marginHorizontal: 18,
  },
})
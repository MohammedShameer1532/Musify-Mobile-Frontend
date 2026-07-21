import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';


const Library = () => {
  const navigation = useNavigation();

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
    <LinearGradient colors={['#0B0B0F', '#1A1A1F']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <AnimatedIcon focused={true}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="white" style={styles.backIcon} />
            </TouchableOpacity>
          </AnimatedIcon>
          <Text style={styles.title}>Library</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Online Songs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Songs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Likedsong')} style={styles.card}>
            <MaterialCommunityIcons name="heart-circle" color="#FF6B6B" size={40} />
            <Text style={styles.cardText}>Liked Songs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddPlaylist')} style={styles.card}>
            <MaterialCommunityIcons name="playlist-music" color="#2196f3" size={40} />
            <Text style={styles.cardText}>Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Download')} style={styles.card} >
            <MaterialCommunityIcons name="cloud-download-outline" color="#2196f3" size={40} />
            <Text style={styles.cardText}>Downloads</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

export default Library

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 18,
  },
  sectionTitle: {
    color: '#bdbdbd',
    fontSize: 14,
    marginBottom: 12,
    textTransform: 'uppercase',
    fontFamily: 'Poppins-Bold',

  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F27',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  cardText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
})

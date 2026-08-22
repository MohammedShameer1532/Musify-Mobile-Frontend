import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AverageColorExtractor from '../common/AverageColorExtractor';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Music from '../common/Music';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { decode } from 'html-entities';


const { width } = Dimensions.get('window'); // ✅ screen width
const SONG_IMAGE_SIZE = Math.min(
  width * 0.62,
  320
);

const BASE_WIDTH = 360;

const scale = (size) => (width / BASE_WIDTH) * size;

const Outersong = () => {
  const [backgroundColor, setBackgroundColor] = useState('rgb(30, 30, 30)');
  const { outerdata } = useContext(SearchContext);
  const navigation = useNavigation();


  const formatSongTitle = (rawTitle) => {
    if (!rawTitle) return 'Unknown';

    const decoded = decode(rawTitle); // Converts &quot; to "
    const titleMatch = decoded.match(/^(.+?)\s*\(From\s+"([^"]+)"\)/i);

    if (titleMatch) {
      const mainTitle = titleMatch[1].trim();
      const source = titleMatch[2].trim();
      return `${mainTitle} from ${source}`;
    }

    return decoded.trim(); // fallback if pattern doesn't match
  };

  return (
    <LinearGradient colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']} locations={[0, 0.5, 1]} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={scale(22)} color="white" />
          </TouchableOpacity>
        </View>

        {!outerdata ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color="#10b981"
            />
            <Text style={styles.loadingText}>
              Loading...
            </Text>
          </View>
        ) : (
          <FlatList
            data={Array.isArray(outerdata) ? outerdata : [outerdata]}
            keyExtractor={(item, index) =>
              item?.id?.toString() ?? `${item?.title}-${index}`
            }
            renderItem={({ item }) => (
              <View style={styles.songContainer}>
                {item?.artist === 'Unknown Artist' ? (
                  <Image
                    source={require("../assets/musicphoto.jpg")}
                    className="rounded-xl "
                    resizeMode="cover"
                    style={[styles.songImage]}
                  />
                ) : (
                  <Image
                    source={{ uri: item?.artwork }}
                    className="rounded-xl"
                    resizeMode="cover"
                    style={[styles.songImage]}
                  />
                )}
                <View
                  style={{
                    marginTop: 20,
                    paddingVertical: 20,
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderRadius: 20,
                    marginHorizontal: 16,
                    alignSelf: 'stretch',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <View style={styles.textContainer}>
                    {/* ALBUM */}
                    <View style={styles.infoRow}>
                      <View style={styles.iconBox}>
                        <MaterialIcons name="album" size={16} color="#1DB954" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Album</Text>
                        <Text style={styles.infoValue}>
                          {formatSongTitle(item?.album)}
                        </Text>
                      </View>
                    </View>

                    {/* SONG */}
                    <View style={styles.infoRow}>
                      <View style={styles.iconBox}>
                        <Ionicons name="musical-note" size={16} color="#1DB954" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Song</Text>
                        <Text style={styles.infoValue}>
                          {formatSongTitle(item?.title)}
                        </Text>
                      </View>
                    </View>

                    {/* ARTIST */}
                    <View style={styles.infoRow}>
                      <View style={styles.iconBox}>
                        <Ionicons name="person" size={16} color="#1DB954" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Artist</Text>
                        <Text style={styles.infoValue}>
                          {formatSongTitle(item?.artist)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Music hideActions />
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  )
}

export default Outersong;


const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 18,
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(29,185,84,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(10),
    fontFamily: 'Poppins-Regular',
    marginBottom: -1,
  },

  infoValue: {
    color: '#fff',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
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
  songContainer: {
    alignItems: 'center',
    marginTop: 0,
  },
  textContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: 18,
  },
  songImage: {
    width: SONG_IMAGE_SIZE,
    height: SONG_IMAGE_SIZE,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  songTitle: {
    fontSize: scale(22),
    color: 'white',
    marginTop: 10,
    fontFamily: 'Poppins-Bold',
    width: 270,
  },
  album: {
    fontSize: scale(13.5),
    fontFamily: 'Poppins-Medium',
    color: '#aaa',
    marginTop: 5,
    width: 290,
  },
  artist: {
    fontSize: scale(14),
    fontFamily: 'Poppins-Regular',
    color: 'grey',
    marginTop: 5,
  },
  icons: {
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 10,
    width: 100,
    position: 'absolute',
    marginLeft: 320,
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '2%',
  },

  loadingContainer: {
    height: 230,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },

  loadingText: {
    color: '#9ca3af',
    marginTop: 8,
    fontSize: scale(13),
    fontFamily: 'Poppins-Regular',
  },

});

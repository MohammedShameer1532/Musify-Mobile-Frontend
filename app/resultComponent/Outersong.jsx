import React, { useContext, useState } from 'react';
import { View, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AverageColorExtractor from '../common/AverageColorExtractor';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Music from '../common/Music';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { decode } from 'html-entities';

const Outersong = () => {
  const [backgroundColor, setBackgroundColor] = useState('rgb(30, 30, 30)');
  const { outerdata } = useContext(SearchContext);
  const navigation = useNavigation();
  console.log("siiii", outerdata);


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
      {console.log('Applying Background Color:', backgroundColor)}
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={25} color="white" />
        </TouchableOpacity>
        {!outerdata ? (
          <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
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

                  <Music />
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
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    marginBottom: -1,
  },

  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 10,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 0,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 18,
    marginTop: -5,
    width: '100%',
  },
  songImage: {
    width: 260,
    height: 260,
  },
  songTitle: {
    fontSize: 22,
    color: 'white',
    marginTop: 10,
    fontFamily: 'Poppins-Bold',
    width: 270,
  },
  album: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Medium',
    color: '#aaa',
    marginTop: 5,
    width: 290,
  },
  artist: {
    fontSize: 14,
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

});

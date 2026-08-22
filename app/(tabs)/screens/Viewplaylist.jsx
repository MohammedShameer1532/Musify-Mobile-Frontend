import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MenuProvider } from 'react-native-popup-menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SearchContext } from '../../contextProvider/searchContext';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';
import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';
import AntDesign from 'react-native-vector-icons/AntDesign';
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Entypo from "react-native-vector-icons/Entypo";
import AverageColorExtractor from '../../common/AverageColorExtractor';
import Music from '../../common/Music';
import { API_URL } from '@env';
import { decode } from 'html-entities';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const { width } = Dimensions.get('window'); // ✅ screen width
const SONG_IMAGE_SIZE = Math.min(
  width * 0.62,
  320
);

const BASE_WIDTH = 360;

const scale = (size) => (width / BASE_WIDTH) * size;

const Viewplaylist = () => {
  const navigation = useNavigation();
  const { addtoplaylist } = useContext(SearchContext);
  const [loading, setLoading] = useState(false);
  const [playlistsong, SetPlaylistsong] = useState([]);
  const playlistId = addtoplaylist;
  const currentSong = useActiveTrack();
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");


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



  const getPlaylistsongs = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      setLoading(true);

      const res = await axios.get(
        `${API_URL}/api/users/${user.uid}/playlists/${playlistId}`
      );
      SetPlaylistsong(res?.data?.songs)

    } catch (error) {
      console.error('API ERROR:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPlaylistsongs();
  }, []);



  const handlePlay = useCallback(async (item) => {
    if (!item) return;

    // If same song, just open sheet
    if (currentSong?.id === item.song_id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {

      const index = playlistsong?.findIndex(s => s.song_id === item.song_id);
      if (index === -1) return;

      await TrackPlayer.reset();

      // Build queue in correct order
      const orderedQueue = [
        playlistsong[index],                       // clicked song first
        ...playlistsong.slice(index + 1),          // songs after clicked
        ...playlistsong.slice(0, index)            // songs before clicked
      ].map(s => ({
        id: s.song_id,
        title: s.title,
        artist: s.artist,
        url: s.url,
        artwork: s.artwork,
        album: s?.album,
        year: s?.year,
      }));

      // Add queue
      await TrackPlayer.add(orderedQueue);

      // Play first (clicked song)
      await TrackPlayer.skip(0);
      sheetRef.current?.snapToIndex(0);
      await TrackPlayer.play();


    } catch (err) {
      console.error("Error:", err);
    }
  }, [currentSong, playlistsong]);



  const handleRemoveSong = async (Id) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const res = await axios.delete(
        `${API_URL}/api/users/${user.uid}/playlists/${playlistId}/song/${Id}`);
      await getPlaylistsongs();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };


  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColor, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );



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
    <MenuProvider skipInstanceCheck >
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={['#191919', '#1A1A1F']} style={styles.container}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} >
                  <Ionicons name="arrow-back" size={scale(22)} color="white" />
                </TouchableOpacity>
                <View style={{ width: 40 }} />
              </View>
            </View>
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
                <LottieView
                  source={require("../../assets/playing.json")}
                  style={{ width: 100, height: 100 }}
                  autoPlay
                  loop
                />
              </View>
            ) : playlistsong.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="music-off" size={80} color="gray" />
                <Text style={{ color: "gray", fontSize: scale(18), marginTop: 15, fontWeight: 600, letterSpacing: 0.5, }}>
                  No songs here yet — add your favorites
                </Text>
              </View>
            ) : (
              <View>
                <FlatList
                  data={playlistsong}
                  keyExtractor={(item) => item.song_id}
                  contentContainerStyle={{
                    padding: 15,
                    paddingBottom: 30,
                  }}
                  ListHeaderComponent={() => (
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={['#ff6a00', '#ee0979']}
                        style={styles.gradientIconContainer}
                      >
                        <MaterialCommunityIcons
                          name="music-circle"
                          size={120}
                          color="#fff"
                          style={styles.heartIcon}
                        />
                        <Text style={styles.overlayText}>Playlist Hub</Text>
                      </LinearGradient>
                    </View>
                  )}
                  renderItem={({ item }) => {

                    const isPlaying =
                      String(currentSong?.id) === String(item?.song_id);
                    return (
                      <TouchableOpacity style={styles.playlistItem} >
                        <View style={styles.songCard} activeOpacity={0.7} >

                          {/* LEFT SIDE (Play area) */}
                          <TouchableOpacity
                            style={styles.songLeft}
                            activeOpacity={0.8}
                            onPress={() => handlePlay(item)}
                          >
                            {item?.artist === "<unknown>" ? (
                              <Image
                                source={require("../../assets/musicphoto.jpg")}
                                style={[styles.songImage,
                                { borderColor: isPlaying ? "#1DB954" : "transparent" }
                                ]
                                }
                              />
                            ) : (
                              <Image
                                source={{ uri: item?.artwork }}
                                style={[styles.songImage,
                                { borderColor: isPlaying ? "#1DB954" : "transparent" }
                                ]
                                }
                              />
                            )}

                            <View style={styles.songTitles}>
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                {isPlaying && (
                                  <LottieView
                                    source={require("../../assets/playing.json")}
                                    style={{ width: 20, height: 20, marginRight: 5 }}
                                    autoPlay
                                    loop
                                  />
                                )}

                                <Text
                                  style={[styles.songTitle,
                                  isPlaying && { color: "#1DB954", }
                                  ]}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {item?.title ? item?.title.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                                </Text>
                              </View>

                              <Text style={styles.artist} numberOfLines={1}
                                ellipsizeMode="tail">
                                {item?.artist ? item?.artist.replace(/\s*\(.*?\)\s*/g, "") : "Unknown Artist"}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* RIGHT SIDE (Delete button) */}
                          <TouchableOpacity
                            onPress={() => handleRemoveSong(item?.song_id)}
                            style={styles.deleteBtn}
                          >
                            <AntDesign name="delete" color="#fff" size={scale(20)} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
            <BottomSheet
              ref={sheetRef}
              index={-1}
              snapPoints={snapPoints}
              enableDynamicSizing={false}
              enablePanDownToClose={true}
              handleIndicatorStyle={{
                backgroundColor: 'grey',
                width: 45,
                height: 5,
                borderRadius: 2,
              }}
              // backgroundStyle={{
              //   backgroundColor: 'rgba(30, 30, 30, 0.95)',
              // }}
              backgroundComponent={GradientBackground}
            >
              <BottomSheetScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingBottom: 80,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}>
                {currentSong?.artwork && (
                  <AverageColorExtractor
                    key={currentSong?.id}
                    imageUrl={currentSong.artwork}
                    onColorExtracted={(color) => {
                      if (color) setBackgroundColor(color);
                    }}
                  />
                )}
                <TouchableOpacity onPress={() => sheetRef.current?.close()} style={{ width: 50 }} className='w-10 mt-0 ml-5'>
                  <Entypo name="chevron-thin-down" size={30} color="white" style={styles.backIcon} className="ml-5" />
                </TouchableOpacity>
                {currentSong && (
                  <View style={styles.songContainer}>
                    {currentSong?.artist !== "<unknown>" ? (
                      <Image
                        source={{ uri: currentSong?.artwork }}
                        style={styles.songImages}
                        className="rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={require("../../assets/musicphoto.jpg")}
                        className="rounded-xl"
                        style={styles.songImages}
                        resizeMode="cover"
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
                              {formatSongTitle(currentSong?.album)}
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
                              {formatSongTitle(currentSong?.title)}
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
                              {formatSongTitle(currentSong?.artist)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Music />
                    </View>
                  </View>
                )}
              </BottomSheetScrollView>
            </BottomSheet>
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
    </MenuProvider>
  )
}

export default Viewplaylist

const styles = StyleSheet.create({
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
  deleteBtn: {
    position: 'absolute',
    right: 30,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 15,
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
    fontWeight: '700',
    height: 40,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  songCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderBottomWidth: 2,
    borderBottomColor: '#333333',
  },
  songLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  songImage: {
    width: scale(58),
    height: scale(58),
    borderRadius: 12,
    marginRight: 14,
    borderWidth: 2,
  },
  songText: { flex: 1 },
  songTitle: {
    color: 'white',
    fontSize: scale(12),
    fontFamily: 'Poppins-Bold',
    marginBottom: -5,
    flex: 1,
    minWidth: 0,
  },
  artist: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: scale(10),
    fontFamily: 'Poppins-Regular',
    marginTop: 5,
    flexShrink: 1,
  },
  songRight: { flexDirection: 'row', alignItems: 'center' },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  songImages: {
    width: SONG_IMAGE_SIZE,
    height: SONG_IMAGE_SIZE,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  songTitles: {
    fontSize: scale(20),
    fontWeight: '600',
    color: 'white',
    marginTop: 10,
    width: 220,
  },
  textContainer: {
    alignSelf: 'stretch',
    paddingHorizontal: 18,
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
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 30
  },
  heartIcon: {
    // optional glow effect
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  overlayText: {
    color: '#fff',
    fontSize: scale(25),
    marginTop: 16,
    fontFamily: 'Poppins-Bold',
  },
  gradientIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 80,
    borderRadius: 24,
  },
})
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import Music from '../common/Music';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TrackPlayer, { Capability, Event, useActiveTrack } from 'react-native-track-player';
import Entypo from "react-native-vector-icons/Entypo";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { SearchContext } from '../contextProvider/searchContext';
import Localsearch from '../common/Localsearch';
import { LegendList } from '@legendapp/list';
import Icon from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { decode } from 'html-entities';
import {
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
const { LocalAudio } = NativeModules;
const eventEmitter =
  new NativeEventEmitter(LocalAudio);


// ====================== Modern Song Item ======================
const SongItem = React.memo(({ song, currentSong, handlePlay, handleDeletesong }) => {



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


  const isPlaying = currentSong?.id === song?.id;

  return (
    <View style={styles.songCard}>

      {/* CLICKABLE SONG AREA */}
      <TouchableOpacity
        onPress={() => handlePlay(song)}
        activeOpacity={0.8}
        style={styles.songLeft}
      >
        {song?.artist === "<unknown>" ? (
          <Image
            source={require("../assets/musicphoto.jpg")}
            className="rounded-xl w-14 h-14"
            resizeMode="cover"
            style={[
              styles.songImage,
              { borderColor: isPlaying ? "#1DB954" : "transparent" }
            ]}
          />
        ) : (
          <Image
            source={{ uri: song.artwork }}
            className="rounded-xl w-14 h-14"
            resizeMode="cover"
            style={[
              styles.songImage,
              { borderColor: isPlaying ? "#1DB954" : "transparent" }
            ]}
          />
        )}

        <View style={styles.songText}>
          <View className="flex-row items-center">
            {currentSong?.id === song?.id && (
              <LottieView
                source={require("../assets/playing.json")}
                style={{ width: 20, height: 20, marginRight: 5 }}
                autoPlay
                loop
              />
            )}

            <Text
              style={[
                styles.songTitle,
                isPlaying && { color: "#1DB954", width: 160, }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {formatSongTitle(song?.title)}
            </Text>
          </View>

          <Text style={styles.artist} numberOfLines={1}>
            {formatSongTitle(song?.artist)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* RIGHT SIDE */}
      <View style={styles.songRight}>

        <TouchableOpacity
          style={styles.playButton}
          onPress={() => handlePlay(song)}
        >
          <FontAwesome
            name="play"
            size={20}
            color="black"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* MENU OUTSIDE TOUCHABLE */}
        <View style={{ alignItems: 'flex-end', padding: 8, marginRight: -5 }}>
          <Menu>
            <MenuTrigger customStyles={{ optionWrapper: { activeOpacity: 0.6 } }}>
              <MaterialCommunityIcons name="dots-vertical" color="#fff" size={28} />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: '#2a2a2a',   // sleek dark background
                  marginTop: 5,
                  width: 115,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 6,
                  paddingHorizontal: 10,
                },
                optionWrapper: {
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
                optionText: {
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: '500',
                  marginLeft: 12,
                },
              }}
            >
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDeletesong(song)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons
                    name="delete"
                    size={24}
                    color="#ff4d4d"
                  />
                  <Text style={{ color: 'white', fontSize: 15, marginLeft: 5, fontFamily: 'Poppins-Bold', }}>Delete</Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </View>
    </View>
  );
});




const LocalMusic = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSongsList } = useContext(SearchContext);
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [showUp, setShowUp] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const currentSong = useActiveTrack();




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



  const fetchAudioFiles = async () => {

    try {

      const files =
        await LocalAudio.getAudioFiles();

      setAudioFiles(files);

      setFilteredFiles(files);

      setSongsList(files);

    } catch (e) {

      console.error(e);
    }
  };


  useEffect(() => {

    const init = async () => {

      try {

        setLoading(true);

        const permission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted =
          await PermissionsAndroid.request(
            permission
          );

        if (
          granted ===
          PermissionsAndroid.RESULTS.GRANTED
        ) {

          await fetchAudioFiles();

          // START WATCHER
          LocalAudio.startWatchingAudio();

        } else {

          setError(
            'Permission denied'
          );
        }

      } catch (err) {

        setError(err.message);

      } finally {

        setLoading(false);
      }
    };

    init();

    // =====================================
    // AUTO REFRESH WHEN NEW SONG ADDED
    // =====================================

    const subscription =
      eventEmitter.addListener(
        'LOCAL_AUDIO_CHANGED',
        async () => {
          await fetchAudioFiles();
        }
      );

    return () => {

      subscription.remove();

      LocalAudio.stopWatchingAudio();
    };

  }, []);


  const handlePlay = useCallback(async (song) => {
    if (!song) return;
    // If same song, just open sheet
    if (currentSong?.id === song.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {
      const index = audioFiles.findIndex(s => s.id === song.id);
      if (index === -1) return;

      await TrackPlayer.reset();

      // Build queue in correct order
      const orderedQueue = [
        audioFiles[index],                       // clicked song first
        ...audioFiles.slice(index + 1),          // songs after clicked
        ...audioFiles.slice(0, index)            // songs before clicked
      ].map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        url: s.path,
        artwork: s.artwork,
        hasArtwork: true,
        album: s.album,
        year:s.year,
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
  }, [audioFiles, currentSong]);




  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowUp(offsetY > 200); // show only after scrolling 200px
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };



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

  const handleDeletesong = async (song) => {
    try {

      await LocalAudio.deleteAudioFile(song.path, song.id);

      // remove from UI instantly
      const updated = audioFiles.filter(item => item.id !== song.id);

      setAudioFiles(updated);
      setFilteredFiles(updated);

    } catch (e) {
      console.log("Delete error", e);
    }
  };

  return (
    <MenuProvider skipInstanceCheck>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={['#050505', '#050505']} style={styles.background}>
          <SafeAreaView className="flex-1">
            <View style={styles.header}>
              {/* Back Button on the left */}
              <AnimatedIcon focused={true}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={22} color="white" />
                </TouchableOpacity>
              </AnimatedIcon>

              {/* Centered Logo + Title */}
              <View style={styles.centerContainer}>

                <Text style={styles.headerTitle}>Local Music</Text>
              </View>

              {/* Spacer on the right to balance layout */}
              <View style={{ width: 40 }} />
            </View>
            <Localsearch audioFiles={audioFiles} setFilteredFiles={setFilteredFiles} />
            {loading ? (
              <LottieView
                source={require("../assets/music.json")}
                autoPlay
                loop
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}
              />
            ) : (
              <View className='flex-1'>
                <LegendList
                  data={filteredFiles}
                  keyExtractor={(item) => item.id}

                  // ✅ Fixed height optimization (MOST IMPORTANT)
                  estimatedItemSize={96}

                  // ✅ Rendering window
                  windowSize={10}
                  drawDistance={1200}

                  // ✅ Initial render
                  initialNumToRender={8}
                  maxToRenderPerBatch={8}

                  // ✅ Memory optimization
                  recycleItems
                  removeClippedSubviews={true}

                  // ✅ Smooth scrolling
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}

                  // ✅ Padding (important for bottom sheet overlap)
                  contentContainerStyle={{
                    padding: 15,
                    paddingBottom: 140,
                  }}

                  // ✅ Re-render ONLY when song changes
                  extraData={currentSong?.id}

                  ref={flatListRef}
                  onScroll={handleScroll}

                  renderItem={({ item }) => (
                    <SongItem
                      song={item}
                      currentSong={currentSong}
                      handlePlay={handlePlay}
                      handleDeletesong={handleDeletesong}
                    />
                  )}
                />
                {!isSheetOpen && showUp && (
                  <TouchableOpacity
                    style={styles.upIcon}
                    onPress={scrollToTop}
                    activeOpacity={0.7}
                  >
                    <AntDesign name="upcircle" size={45} color="white" />
                  </TouchableOpacity>
                )}
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
              backgroundStyle={{
                backgroundColor: '#0b0f0c',
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                borderWidth: 1,
                borderColor: 'rgba(29,185,84,0.25)',
                shadowColor: '#1DB954',
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 20,
              }}
              onChange={(index) => setIsSheetOpen(index >= 0)}
            >
              <TouchableOpacity onPress={() => sheetRef.current?.close()} style={{ width: 50 }} className='w-10 mt-[-5] ml-5'>
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
                      source={require("../assets/musicphoto.jpg")}
                      className="rounded-xl"
                      style={styles.songImages}
                      resizeMode="cover"
                    />
                  )}
                  <View
                    style={{
                      marginTop: 30,
                      paddingVertical: 5,
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
                    <Music hideActions />
                  </View>
                </View>
              )}
            </BottomSheet>
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView >
    </MenuProvider >
  );
};

export default LocalMusic;

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
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    marginBottom: -1,
  },

  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    width: 260,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 10,
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

  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
  },

  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  // Song item
  songCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  songLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  songImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12, borderWidth: 2 },
  songText: { flex: 1 },
  songTitle: { fontSize: 14, fontWeight: '600', color: 'white', fontFamily: 'Poppins-Bold', width: 180, },
  artist: { fontSize: 12, color: 'gray', marginTop: 4, fontFamily: 'Poppins-Regular' },
  songRight: { flexDirection: 'row', alignItems: 'center' },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  upIcon: {
    position: "absolute",
    bottom: 100,
    zIndex: 10,
    alignSelf: "center",
  },
  lottie: {
    position: 'absolute',
    right: 50,
  },

  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backIcon: {
    marginLeft: 10,
    marginTop: 0,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 0,
  },
  songImages: {
    width: 260,
    height: 260,
  },
  songTitles: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 10,
    width: 300,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 18,
    marginTop: 5,
    width: '100%',
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
});

import { ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getAuth } from '@react-native-firebase/auth';
import { API_URL } from '@env';
import axios from 'axios';
import { LegendList } from '@legendapp/list';
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import LottieView from 'lottie-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign';
import BottomSheet from '@gorhom/bottom-sheet';
import Entypo from "react-native-vector-icons/Entypo";
import Music from '../../common/Music';
import AverageColorExtractor from '../../common/AverageColorExtractor';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { decode } from 'html-entities';

const Likedsong = () => {
  const navigation = useNavigation();
  const [showsong, setShowsong] = useState([]);
  const currentSong = useActiveTrack();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

  useEffect(() => {
    const getLikedsong = async () => {
      if (loading) return;
      try {
        setLoading(true);
        const users = getAuth().currentUser;
        const id = users?.uid
        if (!users) {
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_URL}/api/likes/${id}`, {
          params: { userId: users.uid },
        });
        const response = res?.data?.songs;
        setShowsong(response || []);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);   // ✅ ALWAYS reset loading
      }
    }
    getLikedsong();
  }, [])


  const handlelike = async (songId) => {
    if (deletingId) return;

    try {
      setDeletingId(songId);

      const users = getAuth().currentUser;
      if (!users) return;

      await axios.post(`${API_URL}/api/unlike`, {
        userId: users.uid,
        songId: songId,
      });


      // ✅ Remove song locally from list (instant UI update)
      setShowsong(prev =>
        prev.filter(item => item.song_id !== songId)
      );

    } catch (error) {
      console.error("Unlike API error:", error.response?.data || error.message);
    } finally {
      setDeletingId(null);
    }
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

  const handlePlay = useCallback(async (song) => {
    if (!song) return;

    // If same song, just open sheet
    if (currentSong?.id === song.song_id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {

      const index = showsong?.findIndex(s => s.song_id === song.song_id);
      if (index === -1) return;

      await TrackPlayer.reset();

      // Build queue in correct order
      const orderedQueue = [
        showsong[index],                       // clicked song first
        ...showsong.slice(index + 1),          // songs after clicked
        ...showsong.slice(0, index)            // songs before clicked
      ].map(s => ({
        id: s.song_id,
        title: s.title,
        artist: s.artist,
        url: s.url,
        artwork: s.artwork,
        album: s.album,
        year: s.year,
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
  }, [currentSong, showsong]);



  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColor, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );


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
          <View style={{ width: 40 }} />
        </View>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 100 }}>
            <LottieView
              source={require("../../assets/playing.json")}
              style={{ width: 100, height: 100 }}
              autoPlay
              loop
            />
          </View>
        ) : showsong.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', fontWeight: 600, letterSpacing: 0.5 }}>
            <MaterialCommunityIcons name="music-off" size={80} color="gray" />
            <Text style={{ color: "gray", fontSize: 18, marginTop: 15 }}>
              No liked songs yet
            </Text>
          </View>
        ) : (
          <LegendList
            data={showsong}
            keyExtractor={(item, index) =>
              item.song_id?.toString() || index.toString()
            }
            extraData={currentSong}
            estimatedItemSize={96}
            windowSize={10}
            drawDistance={1200}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            recycleItems
            removeClippedSubviews
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}

            contentContainerStyle={{
              padding: 15,
              paddingBottom: 30,
            }}

            ListHeaderComponent={() => (
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#0250c5', '#d43f8d']}
                  style={styles.gradientIconContainer}
                >
                  <MaterialCommunityIcons
                    name="heart"
                    size={120}
                    color="#fff"
                    style={styles.heartIcon}
                  />
                  <Text style={styles.overlayText}>Liked Songs</Text>
                </LinearGradient>
              </View>
            )}

            renderItem={({ item }) => (
              <SongItem
                song={item}
                currentSong={currentSong}
                handlelike={handlelike}
                deletingId={deletingId}
                handlePlay={handlePlay}
              />
            )}
          />
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
          onChange={(index) => setIsSheetOpen(index >= 0)}
        >
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
        </BottomSheet>
      </SafeAreaView>
    </LinearGradient >
  )
}

export default Likedsong;

// ====================== Modern Song Item ======================
const SongItem = React.memo(({ song, currentSong, handlePlay, handlelike, deletingId }) => {
  // const isPlaying = currentSong?.id === song?.song_id;
  const isPlaying =
    String(currentSong?.id) === String(song?.song_id);
  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.songCard}>

        {/* LEFT SIDE (Play area) */}
        <TouchableOpacity
          style={styles.songLeft}
          activeOpacity={0.8}
          onPress={() => handlePlay(song)}
        >
          {song?.artist === "<unknown>" ? (
            <Image
              source={require("../../assets/musicphoto.jpg")}
              style={[styles.songImage, { borderColor: isPlaying ? "#1DB954" : "transparent" }]}
            />
          ) : (
            <Image
              source={{ uri: song?.artwork }}
              style={[styles.songImage, { borderColor: isPlaying ? "#1DB954" : "transparent" }]}
            />
          )}

          <View style={styles.songTitless}>
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
                style={[styles.songTitle, isPlaying && { color: "#1DB954", width: 200 }]}
                numberOfLines={1}
              >
                {song?.title ? song.title.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
              </Text>
            </View>

            <Text style={styles.artist} numberOfLines={1}>
              {song?.artist ? song.artist.replace(/\s*\(.*?\)\s*/g, "") : "Unknown Artist"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* RIGHT SIDE (Delete button) */}
        <TouchableOpacity
          onPress={() => handlelike(song?.song_id)}
          disabled={deletingId === song?.song_id}
          style={styles.deleteBtn}
        >
          <AntDesign name="delete" color="#fff" size={24} />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
});


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
  deleteBtn: {
    position: 'absolute',
    top: 22,
    right: 20,
  },
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
    fontSize: 35,
    fontWeight: '800',
    height: 40,
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
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  gradientIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 80,
    borderRadius: 24,
  },
  // Song item
  songCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderBottomWidth: 2,
    borderBottomColor: '#1e1e1e',
  },
  songLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  songImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12, borderWidth: 2 },
  songText: { flex: 1 },
  songTitle: { fontSize: 14, color: 'white', fontFamily: 'Poppins-Bold', },
  artist: { fontSize: 12, color: 'gray', marginTop: 4, fontFamily: 'Poppins-Regular' },
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
    width: 290,
    height: 290,
  },
  songTitles: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 10,
    width: 300,
  },
  songTitless: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 10,
    width: 220,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 18,
    marginTop: -5,
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

})
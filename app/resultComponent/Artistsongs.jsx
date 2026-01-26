import { ActivityIndicator, Alert, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SearchContext } from '../contextProvider/searchContext';
import axios from 'axios';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/Entypo';
import RNBlobUtil from "react-native-blob-util";
import Clipboard from '@react-native-clipboard/clipboard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { LegendList } from '@legendapp/list';
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AverageColorExtractor from '../common/AverageColorExtractor';
import Music from '../common/Music';
import Entypo from "react-native-vector-icons/Entypo";
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const Artistsongs = () => {
  const { tokens } = useContext(SearchContext);
  const navigation = useNavigation();
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const [backgroundColors, setBackgroundColors] = useState("rgb(30, 30, 30)");
  const [loading, setLoading] = useState(true);
  const [topSongsPage, setTopSongsPage] = useState(0);
  const [topSongs, setTopSongs] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [albumData, setAlbumData] = useState([]);
  const token = tokens.token;
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const snapPoints = useMemo(() => ["100%"]);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const sheet = useRef(null);
  const sheetRef = useRef(null);
  const currentSong = useActiveTrack();
  const songId = currentSong?.id;
  const [songData, setSongData] = useState([]);
  const currentSongId = currentSong?.id;
  const lastPreloadedCount = useRef(0);


  const fetchAlbumPage = async (page = 0) => {
    if (!token) return;
    try {
      page === 0 ? setLoading(true) : setLoadingMore(true);
      const res = await axios.get(`https://www.jiosaavn.com/api.php?__call=webapi.get&token=${token}&type=artist&p=${page}&n_song=30&n_album=30&ctx=wap6dot0&api_version=4&_format=json&_marker=0`)
      console.log('res', res.data);
      setAlbumData(res?.data);
      setTopSongs(prev => {
        const merged = [...prev, ...(res?.data?.topSongs || [])];
        return merged.filter((song, index, self) =>
          index === self.findIndex(s => s.id === song.id));
      });
      setTopSongsPage(page);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }


  const handleLoadMore = () => {
    if (loadingMore) return;
    fetchAlbumPage(topSongsPage + 1);
  };




  useEffect(() => {
    if (token) {
      fetchAlbumPage(0); // fetch first page
    }
  }, [token]);


  useEffect(() => {
    if (!topSongs.length) return;

    const newSongs = topSongs.slice(lastPreloadedCount.current);
    if (!newSongs.length) return;

    const ids = newSongs.map(s => s.id).join(",");

    const preload = async () => {
      try {
        const res = await axios.get(
          `https://musify-api-inky.vercel.app/api/songs?ids=${ids}`
        );

        setSongData(prev => [...prev, ...res.data.data]);
        lastPreloadedCount.current = topSongs.length;
      } catch (e) {
        console.log("Preload error:", e);
      }
    };

    preload();
  }, [topSongs]);



  const handlePlay = useCallback(async (song, index) => {
    if (!song?.id) return;

    if (currentSong?.id === song?.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {
      const ids = topSongs.map(item => item?.id).join(",");
      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs?ids=${ids}`
      );

      const songs = res.data.data;
      if (!songs) return;

      await TrackPlayer.reset();

      const orderedQueue = [
        songs[index],
        ...songs.slice(index + 1),
        ...songs.slice(0, index),
      ].map(s => ({
        id: s?.id,
        title: s?.name,
        url: s?.downloadUrl[4]?.url,
        artwork: s?.image[2]?.url,
        artist: s.artists?.primary[0]?.name,
      }));

      await TrackPlayer.add(orderedQueue);
      await TrackPlayer.play();
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 10);
    } catch (error) {
      console.log('handlePlay error:', error);
    }
  }, [topSongs, currentSong?.id]);



  const getHighResImage = (image) => {
    if (!image) return null;

    // ✅ Case 1: JioSaavn image array
    if (Array.isArray(image)) {
      return (
        image.find(img => img.quality === '500x500')?.link ||
        image.find(img => img.quality === '150x150')?.link ||
        image[image.length - 1]?.link
      );
    }

    // ✅ Case 2: String image (Playlists, Artist)
    if (typeof image === 'string') {
      return image
        .replace(/_\d+x\d+/, '_500x500')
        .replace(/-\d+x\d+/, '-500x500');
    }

    return null;
  };



  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColors, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );


  const handleDownload = async (url, fileName) => {
    try {
      if (!url) {
        Alert.alert("Error", "No download URL available");
        return;
      }

      // Request permission for Android < 13
      if (Platform.OS === 'android' && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'lysernfy needs access to storage to save songs.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission denied', 'Cannot download without storage permission');
          return;
        }
      }

      const filePath = `/storage/emulated/0/Download/${fileName || 'Song.mp3'}`;

      RNBlobUtil.config({
        path: filePath,
        fileCache: true,
        addAndroidDownloads: {
          notification: true,
          title: fileName || "Song",
          description: "Downloading music file...",
          mime: "audio/mpeg",
          mediaScannable: true,
        },
      })
        .fetch("GET", url)
        .then((res) => {
          console.log("✅ Saved to:", res.path());
          setShowDownloadAnim(true); // show animation
          setTimeout(() => setShowDownloadAnim(false), 2000);
          RNBlobUtil.fs.scanFile([{ path: res.path(), mime: "audio/mpeg" }]);
        })
        .catch((err) => {
          console.error("Download error:", err);
          Alert.alert("Error", "Download failed.");
        });
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const fetchLyrics = async () => {
    try {
      const res = await axios.get(`https://jiosaavn-api.vercel.app/lyrics?id=${songId}`);
      const cleanLyrics = res?.data?.lyrics.replace(/<br\s*\/?>/gi, "\n"); // convert <br> to \n
      setLyrics(cleanLyrics);
      sheet.current?.snapToIndex(0);
      console.log("lyriii", cleanLyrics);

    } catch (error) {
      console.log(error);
      sheet.current?.snapToIndex(0);
      setLyrics("Failed to load lyrics");

    }
  };

  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };

  const listHeader = useMemo(() => (
    <View style={{ marginBottom: 25 }}>
      <View style={{ position: 'relative', alignSelf: 'center' }}>
        <Image
          source={{ uri: getHighResImage(tokens?.image) }}
          style={styles.songImagee}
          className="rounded-xl"
        />
        <Text
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 5,
          }}
        >
          {albumData?.name}
        </Text>
      </View>
    </View>
  ), [albumData?.name, tokens?.image]);





  return (
    <MenuProvider skipInstanceCheck>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[backgroundColor, "#000"]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <View className="flex-1">
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35 }} className='w-10 mt-5'>
                <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} className="ml-2" />
              </TouchableOpacity>
              {loading ? (
                <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
              ) : (
                <View >
                  <Topsongs
                    topSongs={topSongs}
                    currentSongId={currentSongId}
                    handlePlay={handlePlay}
                    handleLoadMore={handleLoadMore}
                    loadingMore={loadingMore}
                    listHeader={listHeader}
                    fetchLyrics={fetchLyrics}
                    handleDownload={handleDownload}
                    handleCopy={handleCopy}
                  />

                </View>
              )}
              {showDownloadAnim && (
                <View style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}>
                  <LottieView
                    source={require("../assets/Download.json")}
                    style={{ width: 150, height: 150 }}
                    autoPlay
                    loop={false} // play once
                    onAnimationFinish={() => setShowDownloadAnim(false)}
                  />
                  <Text style={{ color: "white", marginTop: 10, fontSize: 16 }}>
                    Download Complete 🎵
                  </Text>
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
                backgroundComponent={GradientBackground}
              >
                <TouchableOpacity onPress={() => sheetRef.current?.close()} style={{ width: 50 }} className='w-10 mt-0 ml-5'>
                  <Entypo name="chevron-thin-down" size={30} color="white" style={styles.backIcon} className="ml-5" />
                </TouchableOpacity>
                {currentSong?.artwork && (
                  <AverageColorExtractor
                    key={currentSong?.id}
                    imageUrl={currentSong.artwork}
                    onColorExtracted={(color) => {
                      if (color) setBackgroundColors(color);
                      console.log('backgroundcolor', backgroundColors);

                    }}
                  />
                )}
                <View style={styles.songContainer}>
                  {currentSong?.artwork ? (
                    <Image
                      source={{ uri: currentSong.artwork }}
                      style={styles.songImagess}
                      className="rounded-xl"
                    />
                  ) : (
                    <View style={[styles.songImagess, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: 'white' }}>No Image</Text>
                    </View>
                  )}
                  <View
                    style={{
                      marginTop: 35,
                      paddingVertical: 15,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 20,
                      marginHorizontal: 16,
                      alignSelf: 'stretch',
                    }}
                  >
                    <View style={styles.textContainer}>
                      <Text style={styles.songTitless}>{currentSong?.title?.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                      <Text style={styles.artistss}>{currentSong?.artist?.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                      <View style={styles.icons}>
                        <View style={{ alignItems: 'flex-end', padding: 0 }}>
                          <Menu>
                            <MenuTrigger>
                              <Icon name="dots-three-vertical" size={24} color="white" />
                            </MenuTrigger>
                            <MenuOptions
                              customStyles={{
                                optionsContainer: {
                                  padding: 10,
                                  borderRadius: 8,
                                  backgroundColor: '#1f1f1f',
                                },
                              }}
                            >
                              <MenuOption onSelect={fetchLyrics}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                                  <MaterialIcons name="lyrics" size={18} color="white" />
                                  <Text style={{ color: 'white', fontSize: 14 }}>Lyrics</Text>
                                </View>
                              </MenuOption>
                              <MenuOption onSelect={() => handleDownload(currentSong?.url, `${currentSong?.title}.mp3`)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                                  <FontAwesome6 name="download" size={18} color="white" />
                                  <Text style={{ color: 'white', fontSize: 14 }}>Download</Text>
                                </View>
                              </MenuOption>
                            </MenuOptions>
                          </Menu>
                        </View>
                      </View>
                    </View>
                    <Music />
                  </View>
                </View>
              </BottomSheet>
              <BottomSheet
                ref={sheet}
                index={-1}
                snapPoints={lyricsSnapPoints}
                enableDynamicSizing={false}
                enablePanDownToClose={true} F
                handleIndicatorStyle={{
                  backgroundColor: 'grey',
                  width: 45,
                  height: 5,
                  borderRadius: 2,
                }}
                backgroundStyle={{ backgroundColor: '#000' }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    marginLeft: 10,
                    marginTop: 5.5,
                    marginBottom: 20,
                    fontWeight: "bold",
                    color: "grey",
                  }}
                >
                  Lyrics 🎶
                </Text>
                <TouchableOpacity style={styles.clearIcon} onPress={() => sheet.current?.close()}>
                  <Ionicons name="close-circle" size={25} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ position: "absolute", right: 50, top: "2%" }}
                  onPress={handleCopy}
                >
                  {copied ? (
                    <Ionicons name="checkbox-outline" size={25} color="grey" />
                  ) : (
                    <MaterialDesignIcons name="clipboard-text-multiple" size={25} color="grey" />
                  )}
                </TouchableOpacity>
                <BottomSheetScrollView
                  contentContainerStyle={{ padding: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 14,
                      textAlign: "center",   // centers text horizontally
                      lineHeight: 22,
                      marginBottom: 80,     // better readability
                    }}
                  >
                    {lyrics}
                    -----
                  </Text>
                </BottomSheetScrollView>
              </BottomSheet>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
    </MenuProvider>
  )
}

export default Artistsongs;


const Topsongs = React.memo(({ topSongs, currentSongId, handlePlay, handleLoadMore, loadingMore, listHeader, fetchLyrics, handleDownload }) => {
  return (
    <View className='mt-0' >
      <LegendList
        data={topSongs}
        extraData={currentSongId}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: song, index }) => (
          <View style={{ paddingHorizontal: 14, paddingVertical: 4, }}>
            <TouchableOpacity onPress={() => handlePlay(song, index)} activeOpacity={0.8} style={styles.songCard}>
              <View style={styles.songLeft}>
                {song?.artist === "<unknown>" ? (
                  <Image
                    source={require("../assets/musicphoto.jpg")}
                    className="rounded-xl w-14 h-14"
                    resizeMode="cover"
                    style={[styles.songImage, { borderColor: currentSongId === song?.id ? "#1DB954" : "transparent" }]}
                  />
                ) : (
                  <Image
                    source={{ uri: song?.image }}
                    className="rounded-xl w-14 h-14"
                    resizeMode="cover"
                    style={[styles.songImage, { borderColor: currentSongId === song?.id ? "#1DB954" : "transparent" }]}
                  />
                )}
                <View style={styles.songText} >
                  <View className="flex-row items-center">
                    {/* Playing Animation: only shows for current song */}
                    {currentSongId === song?.id && (
                      <LottieView
                        source={require("../assets/playing.json")}
                        style={{ width: 20, height: 20, marginRight: 5 }}
                        autoPlay
                        loop
                      />
                    )}

                    {/* Song Title */}
                    <Text
                      style={[styles.songTitle, currentSongId === song?.id && { color: "#1DB954" }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {song?.title?.replace(/\s*\(.*?\)\s*/g, "")}
                    </Text>
                  </View>
                  <Text style={styles.artist} numberOfLines={1}>
                    {song?.more_info?.album?.replace(/\s*\(.*?\)\s*/g, "")}
                  </Text>
                </View>
              </View>
              <View style={styles.songRight}>
                <View style={styles.playButton}>
                  <FontAwesome
                    name="play"
                    size={20}
                    color="black"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <View style={{ alignItems: 'flex-end', padding: 5, marginRight: -10 }}>
                  <Menu>
                    <MenuTrigger>
                      <Icon name="dots-three-vertical" size={24} color="white" />
                    </MenuTrigger>
                    <MenuOptions
                      customStyles={{
                        optionsContainer: {
                          padding: 10,
                          borderRadius: 8,
                          backgroundColor: '#1f1f1f',
                        },
                      }}
                    >
                      <MenuOption onSelect={fetchLyrics}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                          <MaterialIcons name="lyrics" size={18} color="white" />
                          <Text style={{ color: 'white', fontSize: 14 }}>Lyrics</Text>
                        </View>
                      </MenuOption>
                      <MenuOption onSelect={() => handleDownload(song.downloadUrl[4]?.url, `${song?.name}.mp3`)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
                          <FontAwesome6 name="download" size={18} color="white" />
                          <Text style={{ color: 'white', fontSize: 14 }}>Download</Text>
                        </View>
                      </MenuOption>
                    </MenuOptions>
                  </Menu>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
        // Pagination
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}

        // 🎯 Layout & sizing (MOST IMPORTANT)
        estimatedItemSize={150}
        getEstimatedItemSize={() => 150}

        // 🚀 Rendering behavior
        recycleItems
        removeClippedSubviews={false}
        drawDistance={500}
        windowSize={17}

        // Batch tuning
        initialNumToRender={10}
        maxToRenderPerBatch={10}

        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={listHeader}

        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="large" color="white" />
            </View>
          ) : null
        }
      />
    </View>
  );
});



const styles = StyleSheet.create({
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  songTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
  artist: { fontSize: 12, color: 'gray', marginTop: 4 },
  songRight: { flexDirection: 'row', alignItems: 'center' },
  decImages: {
    width: 120,
    height: 120,

  },
  songImagee: {
    width: 290,
    height: 290,
    display: 'flex',
    alignSelf: 'center',
  },
  songImages: {
    width: 60,
    height: 60,
    borderRadius: 15,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backIcon: {
    marginLeft: 10,
    marginTop: 10,
  },
  songContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 30,
    marginTop: 10,
  },
  songImagess: {
    width: 300,
    height: 300,
  },
  songTitless: {
    flexShrink: 1,
    flexWrap: "wrap",
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
    width: 300,
  },
  album: {
    fontSize: 16,
    color: 'grey',
    marginTop: 5,
  },
  artistss: {
    fontSize: 14,
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
  iconCard: {
    width: 120,        // same as image width
    height: 120,       // same as image height
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 25,
  },

});
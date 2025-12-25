import { ActivityIndicator, Alert, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useMemo, useState } from 'react'
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


const Artistsongs = () => {
  const { tokens } = useContext(SearchContext);
  const navigation = useNavigation();
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
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



  const fetchAlbumPage = async (page = 0) => {
    if (!token) return;
    const startTime = Date.now();
    try {
      page === 0 ? setLoading(true) : setLoadingMore(true);
      const res = await axios.get(`https://www.jiosaavn.com/api.php?__call=webapi.get&token=${token}&type=artist&p=${page}&n_song=30&n_album=30&ctx=wap6dot0&api_version=4&_format=json&_marker=0`)
      const endTime = Date.now(); // ⏱ end
      console.log(`API response time (page ${page}):`, endTime - startTime, "ms");

      console.log('res', res.data);
      setAlbumData(res?.data);
      const song = res?.data?.topSongs;
      setTopSongs(prev =>
        page === 0 ? song : [...prev, ...song] // ✅ append
      );
      setTopSongsPage(page);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const handleLoadMore = async () => {
    if (loading || loadingMore) return; // exit if already loading

    try {
      await fetchAlbumPage(topSongsPage + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };



  useEffect(() => {
    if (token) {
      fetchAlbumPage(0); // fetch first page
    }
  }, [token]);

  useEffect(() => {
    console.log('topSongs length:', topSongs.length);
  }, [topSongs]);







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
      colors={[backgroundColor, "#000"]}
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
            message: 'Musify needs access to storage to save songs.',
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



  // ====================== Song Item Component ======================
  const SongItem = React.memo(({ index, song, currentSong, handlePlay }) => {

    return (
      <View className="flex-row mt-5 ml-5 items-center justify-between pr-5 w-full">
        <TouchableOpacity onPress={() => handlePlay(song, index)}
          className="flex-1">
          <View className="flex-row items-center justify-between w-full">

            {/* Left Section: Image + Text */}
            <View className="flex-row items-center flex-1">
              {song?.artist === "<unknown>" ? (
                <Image
                  source={require("../assets/musicphoto.jpg")}
                  className="rounded-xl w-14 h-14"
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={{ uri: song?.image }}
                  className="rounded-xl w-14 h-14"
                  resizeMode="cover"
                />
              )}
              {/* Space between image and text */}
              <View className="ml-3 flex-1">
                {/* Title + Playing Animation in a Row */}
                <View className="flex-row items-center">
                  {/* Playing Animation: only shows for current song */}
                  {currentSong?.id === song?.id && (
                    <LottieView
                      source={require("../assets/playing.json")}
                      style={{ width: 20, height: 18, marginRight: 6 }}
                      autoPlay
                      loop
                    />
                  )}

                  {/* Song Title */}
                  <Text
                    style={{
                      color: currentSong?.id === song?.id ? "limegreen" : "white",
                    }}
                    className="text-base font-normal"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {song?.title ? song?.title?.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                  </Text>
                </View>

                {/* Artist stays below the title */}
                <Text
                  className="text-gray-500 text-sm font-medium mt-1"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {song?.more_info?.album ? song?.more_info?.album?.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                </Text>
              </View>
            </View>
            {/* Right Section: Lottie + Play Button */}
            <View className="flex-row items-center">
              <View className="pr-1">
                {currentSong?.id === song?.id && (
                  <LottieView
                    source={require("../assets/music.json")}
                    style={{ width: 60, height: 60 }}
                    autoPlay
                    loop
                  />
                )}
              </View>
              <View className="mr-3 w-12 h-12 bg-[#1DB954] rounded-full items-center justify-center shadow-lg">
                <FontAwesome
                  name="play"
                  size={20}
                  color="black"
                  style={{ marginLeft: 4 }}
                />
              </View>
              <View style={{ alignItems: 'flex-end', padding: 16 }}>
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
          </View>
        </TouchableOpacity>
      </View>
    );
  });




  const renderSongItem = React.useCallback(
    ({ item, index }) => (
      <SongItem
        song={item}
        index={index}
      // currentSong={currentSong}
      // handlePlay={handlePlay}
      />
    ),
    []
  );



  return (
    <MenuProvider>
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
                  <LegendList
                    data={topSongs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderSongItem}
                    onItemSizeChanged={({ size }) => {
                      console.log('Rendered item size:', size);
                    }}

                    // Pagination
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.6}

                    // 🎯 Layout & sizing (MOST IMPORTANT)
                    estimatedItemSize={100}
                    getEstimatedItemSize={() => 100}

                    // 🚀 Rendering behavior
                    recycleItems
                    removeClippedSubviews
                    drawDistance={200}
                    windowSize={15}
                    waitForInitialLayout

                    // Batch tuning
                    initialNumToRender={12}
                    maxToRenderPerBatch={10}

                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}

                    ListHeaderComponent={
                      <View>
                        <View style={{ position: 'relative', alignSelf: 'center' }}>
                          <Image
                            source={{ uri: getHighResImage(tokens?.image) }}
                            style={styles.songImagee}
                            className="rounded-xl"
                          />
                          <Text
                            style={{
                              position: 'absolute',      // makes it overlay the image
                              bottom: 10,                // distance from bottom
                              left: 10,                  // distance from left
                              color: 'white',
                              fontSize: 24,
                              fontWeight: 'bold',
                              textShadowColor: 'rgba(0,0,0,0.7)', // optional shadow for readability
                              textShadowOffset: { width: 1, height: 1 },
                              textShadowRadius: 5,
                            }}
                          >
                            {albumData?.name}
                          </Text>
                        </View>
                      </View>
                    }

                    ListFooterComponent={
                      loadingMore ? (
                        <View style={{ paddingVertical: 20 }}>
                          <ActivityIndicator size="large" color="white" />
                        </View>
                      ) : null
                    }
                  />
                </View>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
    </MenuProvider>
  )
}

export default Artistsongs;


const styles = StyleSheet.create({
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
    marginTop: 35,
  },
  songImage: {
    width: 290,
    height: 290,
  },
  songTitle: {
    flexShrink: 1,
    flexWrap: "wrap",
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 10,
  },
  album: {
    fontSize: 16,
    color: 'grey',
    marginTop: 5,
  },
  artist: {
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
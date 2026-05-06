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
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { decode } from 'html-entities';
import * as Progress from 'react-native-progress';
import { API_URL } from '@env';

const Artistsongs = () => {
  const { tokens, setQrdata } = useContext(SearchContext);
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
  const lyricsCache = useRef({});
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const songDetailsMap = useRef({});
  const [globalDownload, setGlobalDownload] = useState({
    progress: 0,
    isDownloading: false,
  });
  console.log('tokens', tokens);


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
      console.log('testing songs', songs);

      songs.forEach(s => { songDetailsMap.current[s.id] = s; });
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
        album: s?.album?.name,
        year: s?.year,
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




  const handleDownload = async (item) => {
    try {
      console.log('loging the handledownload', item);

      // Permission for Android < 13
      if (Platform.OS === "android" && Platform.Version < 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs storage access to save songs.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission denied", "Cannot download without permission");
          return;
        }
      }

      const safeName = (formatSongTitle(item?.name) || "Song").replace(/[^\w\s-]/g, "_");
      const downloadDir = `/storage/emulated/0/Download`;
      const destPath = `${downloadDir}/${safeName}.mp3`;

      // ✅ Start download
      setGlobalDownload({
        progress: 0,
        downloadedMB: 0,
        isDownloading: true,
      });

      RNBlobUtil.config({
        fileCache: true,
        appendExt: "mp3",
      })
        .fetch(
          "POST",
          `${API_URL}/api/download`,
          { "Content-Type": "application/json" },
          JSON.stringify({
            mp3Url: item?.downloadUrl?.[4]?.url,
            imageUrl: item?.image?.[2]?.url,
            title: formatSongTitle(item?.name),
            artist: formatSongTitle(item?.artists?.primary?.[0]?.name),
            album: formatSongTitle(item?.album?.name),
            year: item?.year,
          })
        )
        .progress({ interval: 250 }, (received, total) => {
          const percent = Math.floor((received / total) * 100);
          const speed = (received / 1024 / 1024).toFixed(2);

          setGlobalDownload(prev => ({
            ...prev,
            progress: percent,
            downloadedMB: speed,
          }));
        })
        .then(async (res) => {
          try {
            const tempPath = res.path();

            const exists = await RNBlobUtil.fs.exists(destPath);
            if (exists) await RNBlobUtil.fs.unlink(destPath);

            const dirExists = await RNBlobUtil.fs.exists(downloadDir);
            if (!dirExists) await RNBlobUtil.fs.mkdir(downloadDir);

            await RNBlobUtil.fs.cp(tempPath, destPath);
            await RNBlobUtil.fs.unlink(tempPath);

            await RNBlobUtil.fs.scanFile([{ path: destPath, mime: "audio/mpeg" }]);

            // ✅ Stop loader + show animation
            setGlobalDownload({
              progress: 100,
              downloadedMB: 0,
              isDownloading: false,
            });

            setShowDownloadAnim(true);

          } catch (err) {
            setGlobalDownload({
              progress: 0,
              downloadedMB: 0,
              isDownloading: false,
            });

            Alert.alert("Error", "Failed to save file: " + err.message);
          }
        })
        .catch((err) => {
          setGlobalDownload({
            progress: 0,
            downloadedMB: 0,
            isDownloading: false,
          });

          Alert.alert("Error", "Download failed: " + err.message);
        });

    } catch (error) {
      setGlobalDownload({
        progress: 0,
        downloadedMB: 0,
        isDownloading: false,
      });

      Alert.alert("Error", "Something went wrong");
    }
  };



  const fetchLyrics = async (songid) => {
    if (!songid) return;

    // 🔥 Return cached lyrics if exists
    if (lyricsCache.current[songid]) {
      setLyrics(lyricsCache.current[songid]);
      sheet.current?.snapToIndex(0);
      return;
    }

    try {
      const res = await axios.get(
        `https://jiosaavn-api.vercel.app/lyrics?id=${songid}`
      );

      const cleanLyrics = res?.data?.lyrics?.replace(/<br\s*\/?>/gi, "\n");

      lyricsCache.current[songid] = cleanLyrics; // 🔥 store in cache
      setLyrics(cleanLyrics);
      sheet.current?.snapToIndex(0);
      console.log("lyriii", cleanLyrics);

    } catch (error) {
      setLyrics("Lyrics not found"); // 👈 better message
    } finally {
      sheet.current?.snapToIndex(0); // ✅ ALWAYS open sheet
    }
  };


  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }


  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
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

  const selectedSongDetails = songDetailsMap.current[currentSong?.id];



  return (
    <MenuProvider skipInstanceCheck>
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']}
          locations={[0, 0.5, 1]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>
              {tokens?.image && (
                <AverageColorExtractor
                  key={tokens?.image}
                  imageUrl={tokens?.image}
                  onColorExtracted={(color) => {
                    if (color) {
                      setBackgroundColor(color);
                    }
                  }}
                />
              )}
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
                    handleshowqr={handleshowqr}
                    songDetailsMap={songDetailsMap}
                  />
                </View>
              )}
              {globalDownload.isDownloading && globalDownload.progress < 100 && (
                <View style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.85)",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}>
                  <Progress.Circle
                    size={110}
                    progress={globalDownload.progress / 100}
                    showsText={true}
                    formatText={() => `${globalDownload.progress}%`}
                    thickness={9}
                    color="#1DB954"
                    unfilledColor="rgba(255,255,255,0.1)"
                    borderWidth={0}
                    strokeCap="round"
                    style={{
                      shadowColor: "#1DB954",
                      shadowOpacity: 0.8,
                      shadowRadius: 15,
                      transform: [{ scale: 1.05 }],
                    }}
                    textStyle={{
                      fontFamily: 'Poppins-Bold',
                      fontSize: 18,
                      color: 'white',
                    }}
                  />
                  <Text style={{
                    color: "white",
                    marginTop: 14,
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: 18,
                    letterSpacing: 0.8,
                  }}>
                    {globalDownload.downloadedMB} MB
                  </Text>
                  <Text style={{
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 6,
                    fontFamily: 'Poppins-Regular',
                    fontSize: 14,
                  }}>
                    Downloading premium content…
                  </Text>
                </View>
              )}

              {showDownloadAnim && (
                <View style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.9)",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}>
                  <LottieView
                    source={require("../assets/Download.json")}
                    style={{ width: 120, height: 120 }}
                    autoPlay
                    loop={false}
                    onAnimationFinish={() => setShowDownloadAnim(false)}
                  />
                  <Text style={{
                    marginTop: 12,
                    fontSize: 18,
                    fontFamily: 'Poppins-Bold',
                    backgroundClip: "text",
                    color: "white",
                    letterSpacing: 1,
                  }}>
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
                <BottomSheetScrollView>
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
                        <View style={styles.icons}>
                          <View style={{ alignItems: 'flex-end', padding: 0 }}>
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
                                    width: 140,
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
                                <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(currentSong?.id)}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="lyrics" size={20} color="#1DB954" />
                                    <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Lyrics</Text>
                                  </View>
                                </MenuOption>
                                <View style={{
                                  height: 1,
                                  backgroundColor: '#444',  // softer, modern divider
                                  marginVertical: 6,
                                  marginHorizontal: 10,
                                  width: 'auto'
                                }} />
                                <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(selectedSongDetails || currentSong)}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <FontAwesome6 name="download" size={20} color="#4da6ff" />
                                    <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Download</Text>
                                  </View>
                                </MenuOption>
                                <View style={{
                                  height: 1,
                                  backgroundColor: '#444',  // softer, modern divider
                                  marginVertical: 6,
                                  marginHorizontal: 10,
                                  width: 'auto'
                                }} />
                                <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleshowqr(currentSong)}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="qr-code-outline" color="#cccccc" size={24} />
                                    <Text style={{ color: 'white', fontSize: 12, marginLeft: 10, fontFamily: 'Poppins-Bold', }}>QR Code</Text>
                                  </View>
                                </MenuOption>
                              </MenuOptions>
                            </Menu>
                          </View>
                        </View>
                      </View>
                      <Music />
                    </View>
                    {selectedSongDetails && (
                      <View style={{
                        alignSelf: 'stretch',
                        marginHorizontal: 16,
                        marginTop: 16,
                        borderRadius: 18,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                        marginBottom: 25,
                      }}>
                        <LinearGradient
                          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
                          style={{ padding: 16 }}
                        >
                          {/* Section title */}
                          <Text style={{
                            color: '#1DB954', fontSize: 11, fontFamily: 'Poppins-Bold',
                            letterSpacing: 2, marginBottom: 12,
                          }}>
                            SONG INFO
                          </Text>

                          {[
                            { icon: 'calendar-outline', iconLib: 'Ionicons', label: 'Release Date', value: selectedSongDetails?.releaseDate },
                            { icon: 'time-outline', iconLib: 'Ionicons', label: 'Year', value: selectedSongDetails?.year },
                            { icon: 'pricetag-outline', iconLib: 'Ionicons', label: 'Label', value: selectedSongDetails?.label },
                            { icon: 'headphones', iconLib: 'Material', label: 'Play Count', value: selectedSongDetails?.playCount?.toLocaleString() },
                            { icon: 'copyright', iconLib: 'Material', label: 'Copyright', value: selectedSongDetails?.copyright },
                          ].map(({ icon, iconLib, label, value }, i, arr) =>
                            value ? (
                              <View key={label}>
                                <View style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingVertical: 10,
                                }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {iconLib === 'Ionicons'
                                      ? <Ionicons name={icon} size={15} color="rgba(255,255,255,0.4)" />
                                      : <MaterialIcons name={icon} size={15} color="rgba(255,255,255,0.4)" />
                                    }
                                    <Text style={{
                                      color: 'rgba(255,255,255,0.45)', fontSize: 12,
                                      fontFamily: 'Poppins-Regular',
                                    }}>
                                      {label}
                                    </Text>
                                  </View>
                                  <Text style={{
                                    color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold',
                                    maxWidth: '55%', textAlign: 'right',
                                  }}>
                                    {value}
                                  </Text>
                                </View>
                                {/* divider — skip after last item */}
                                {i < arr.length - 1 && (
                                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                                )}
                              </View>
                            ) : null
                          )}
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                </BottomSheetScrollView>
              </BottomSheet>
              <BottomSheet
                ref={sheet}
                index={-1}
                snapPoints={lyricsSnapPoints}
                enableDynamicSizing={false}
                enablePanDownToClose={true}
                handleIndicatorStyle={{
                  backgroundColor: 'grey',
                  width: 45,
                  height: 5,
                  borderRadius: 2,
                }}
                backgroundStyle={{
                  backgroundColor: '#000',
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                }}
              >
                <View style={{ display: 'flex', flexDirection: 'row', marginLeft: 10, marginTop: 10 }}>
                  <MaterialIcons name="lyrics" size={25} color="#1DB954" />

                  <Text
                    style={{
                      fontSize: 18,
                      marginLeft: 10,
                      color: "grey",
                      fontFamily: 'Poppins-Bold',
                    }}
                  >

                    Lyrics 🎶
                  </Text>
                </View>
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
                      fontFamily: 'Poppins-Bold',
                    }}
                  >
                    {lyrics}
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


const Topsongs = React.memo(({ topSongs, currentSongId, handlePlay, handleLoadMore, loadingMore, listHeader, fetchLyrics, songDetailsMap, handleDownload, handleshowqr }) => {
  return (
    <View className='mt-0' >
      <LegendList
        data={topSongs}
        extraData={currentSongId}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: song, index }) => (
          <View style={{ paddingHorizontal: 14, paddingVertical: 4, }}>
            <View style={styles.songCard}>
              <TouchableOpacity onPress={() => handlePlay(song, index)} activeOpacity={0.8} style={{ flex: 1 }}>
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
              </TouchableOpacity>
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
                          width: 140,
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
                      <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(song?.id)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MaterialIcons name="lyrics" size={20} color="#1DB954" />
                          <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Lyrics</Text>
                        </View>
                      </MenuOption>
                      <View style={{
                        height: 1,
                        backgroundColor: '#444',  // softer, modern divider
                        marginVertical: 6,
                        marginHorizontal: 10,
                        width: 'auto'
                      }} />
                      <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }}
                        onSelect={async () => {
                          let fullSong = songDetailsMap.current[song.id];

                          if (!fullSong) {
                            try {
                              const res = await axios.get(
                                `https://musify-api-inky.vercel.app/api/songs?ids=${song.id}`
                              );
                              fullSong = res.data.data[0];

                              // cache it
                              songDetailsMap.current[song.id] = fullSong;
                            } catch (e) {
                              console.log("Fetch song for download failed", e);
                              return;
                            }
                          }

                          handleDownload(fullSong);
                        }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <FontAwesome6 name="download" size={20} color="#4da6ff" />
                          <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold', }}>Download</Text>
                        </View>
                      </MenuOption>
                      <View style={{
                        height: 1,
                        backgroundColor: '#444',  // softer, modern divider
                        marginVertical: 6,
                        marginHorizontal: 10,
                        width: 'auto'
                      }} />
                      <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleshowqr(song)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="qr-code-outline" color="#cccccc" size={24} />
                          <Text style={{ color: 'white', fontSize: 12, marginLeft: 10, fontFamily: 'Poppins-Bold', }}>QR Code</Text>
                        </View>
                      </MenuOption>
                    </MenuOptions>
                  </Menu>
                </View>
              </View>
            </View>
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
    // zIndex: 1000,
  },
  albumImage: {
    width: 260,
    height: 260,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },

  albumInfo: {
    marginTop: 18,
    alignItems: 'center',
  },

  albumTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    textAlign: 'center',
  },

  albumMeta: {
    marginTop: 0,
    fontSize: 14,
    color: '#cfcfcf',
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 50,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#1DB954",
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    marginRight: 5,
  },
  // Song item
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(10px)',
  },
  songLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  songImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12, borderWidth: 2 },
  songText: { flex: 1 },
  songTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: 'white',
  },
  artist: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 4
  },
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
    paddingLeft: 18,
    marginTop: -5,
    width: '100%',
  },
  songImagess: {
    width: 260,
    height: 260,
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
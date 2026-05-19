import { ActivityIndicator, Alert, FlatList, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from "react-native-linear-gradient";
import AverageColorExtractor from '../common/AverageColorExtractor';
import { SearchContext } from '../contextProvider/searchContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Music from '../common/Music';
import TrackPlayer, { Capability, Event, useActiveTrack } from 'react-native-track-player';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from "react-native-vector-icons/Entypo";
import LottieView from 'lottie-react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import RNBlobUtil from "react-native-blob-util";
import { decode } from 'html-entities';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import * as Progress from 'react-native-progress';
import { NativeModules } from "react-native";



const Rresult = () => {
  const { dataSearch, setQrdata } = useContext(SearchContext);
  const [stationid, setStationid] = useState([]);
  const [songid, setSongid] = useState('');
  const name = dataSearch.id;
  const lang = dataSearch.moreInfo.language;
  console.log('datasearch', dataSearch);
  const [rData, setRData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const [backgroundColors, setBackgroundColors] = useState("rgb(30, 30, 30)");
  const sheetRef = useRef(null);
  const sheet = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const currentSong = useActiveTrack();
  const songId = currentSong?.id;
  const navigation = useNavigation();
  const [songData, setSongData] = useState([]);
  const lyricsCache = useRef({});
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const songDetailsMap = useRef({});
  const topColor = dataSearch?.moreInfo?.color || "#000";
  const gradientTop = topColor + "cc";  // adds 80% opacity
  console.log("songData", dataSearch);
  console.log("currentSong", currentSong);
  const [globalDownload, setGlobalDownload] = useState({
    progress: 0,
    isDownloading: false,
  });

  const { Mp3TagModule } = NativeModules;




  useEffect(() => {
    if (!name || name.trim() === '') {
      console.warn('Search name is empty. Skipping API call.');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://www.jiosaavn.com/api.php?language=${lang}&pid=&query=&name=${name}&mode=&artistid=&api_version=4&_format=json&_marker=0&ctx=wap6dot0&__call=webradio.createFeaturedStation`
        );

        const stationIdValue = response.data.stationid;
        if (!stationIdValue) {
          console.warn('No station ID returned.');
          setLoading(false);
          return;
        }

        setStationid(stationIdValue);

        const songResponse = await axios.get(
          `https://www.jiosaavn.com/api.php?__call=webradio.getSong&stationid=${stationIdValue}&k=20&next=1&api_version=4&_format=json&_marker=0&ctx=wap6dot0`
        );

        const stdata = songResponse.data;

        // ✅ Convert all numeric songs into an array
        const songArray = Object.keys(stdata)
          .filter(key => !isNaN(key))
          .map(key => stdata[key]);

        // ✅ Include top-level "song" if it exists
        if (stdata.song) {
          songArray.unshift({ song: stdata.song });
        }
        setRData(songArray);
        setLoading(false);

        console.log("Processed Songs:", songArray);
      } catch (error) {
        console.error("Error fetching radio data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [name]);

  console.log("dddd", rData);


  const preloadAllSongs = async () => {
    try {
      const ids = rData.map(item => item.song.id).join(",");

      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs?ids=${ids}`
      );

      const apiSongs = res.data.data;
      setSongData(apiSongs);

      console.log("🔥 All songs preloaded", apiSongs);
    } catch (e) {
      console.log("Preload error:", e);
    }
  };

  useEffect(() => {
    if (rData.length > 0) {
      preloadAllSongs();
    }
  }, [rData]);



  const handlePlay = async (song, index) => {
    if (!song?.song) return;

    if (currentSong?.id === song.song.id) {
      sheetRef.current?.snapToIndex(0);
      return;
    }

    try {
      const songs = songData;
      if (!songs.length) return;
      songs.forEach(s => { songDetailsMap.current[s.id] = s; });

      await TrackPlayer.reset();

      const orderedQueue = [
        songs[index],
        ...songs.slice(index + 1),
        ...songs.slice(0, index),
      ].map(s => ({
        id: s?.id,
        title: s?.name,
        artist: s?.artists?.primary[0]?.name || 'Unknown',
        url: s?.downloadUrl[4]?.url || 'Unknown',
        artwork: s?.image[2]?.url,
        album: s?.album?.name,
        year: s?.year,
      }));
      console.log('orderqueqe', orderedQueue);

      await TrackPlayer.add(orderedQueue);
      await TrackPlayer.skip(0);
      await TrackPlayer.play();


      sheetRef.current?.snapToIndex(0);


    } catch (error) {
      console.log('handlePlay error:', error);
    }
  };



  const handleDownload = async (item) => {

    try {

      console.log("Downloading song:", item);

      // =========================
      // ANDROID STORAGE PERMISSION
      // =========================

      if (
        Platform.OS === "android" &&
        Platform.Version < 33
      ) {

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

          Alert.alert(
            "Permission denied",
            "Cannot download without permission"
          );

          return;
        }
      }

      // =========================
      // SAFE FILE NAME
      // =========================

      const safeName = (
        formatSongTitle(item?.name) || "Song"
      )
        .replace(/[<>:"/\\|?*]+/g, "")
        .trim();

      // =========================
      // SONG URL
      // =========================

      const songUrl = item?.downloadUrl?.[4]?.url;

      if (!songUrl) {

        Alert.alert(
          "Error",
          "Song URL not found"
        );

        return;
      }

      console.log("SONG URL:", songUrl);

      // =========================
      // DETECT FILE TYPE
      // =========================

      const extension =
        songUrl.includes(".mp4")
          ? "m4a"
          : "mp3";

      console.log("EXTENSION:", extension);

      // =========================
      // PATHS
      // =========================

      const tempPath =
        `${RNBlobUtil.fs.dirs.CacheDir}/${safeName}.${extension}`;

      const finalPath =
        `/storage/emulated/0/Download/${safeName}.${extension}`;

      // =========================
      // START LOADER
      // =========================

      setGlobalDownload({
        progress: 0,
        downloadedMB: 0,
        isDownloading: true,
      });

      // =========================
      // DELETE OLD TEMP FILE
      // =========================

      const tempExists =
        await RNBlobUtil.fs.exists(tempPath);

      if (tempExists) {

        await RNBlobUtil.fs.unlink(tempPath);
      }

      // =========================
      // DELETE OLD FINAL FILE
      // =========================

      const finalExists =
        await RNBlobUtil.fs.exists(finalPath);

      if (finalExists) {

        await RNBlobUtil.fs.unlink(finalPath);
      }

      // =========================
      // DOWNLOAD FILE
      // =========================

      const res = await RNBlobUtil.config({
        path: tempPath,
        fileCache: true,
      })
        .fetch(
          "GET",
          songUrl,
          {
            "Cache-Control": "no-store",
          }
        )
        .progress(
          { interval: 250 },
          (received, total) => {

            const percent = Math.floor(
              (received / total) * 100
            );

            const downloadedMB = (
              received /
              1024 /
              1024
            ).toFixed(2);

            setGlobalDownload({
              progress: percent,
              downloadedMB,
              isDownloading: true,
            });

          }
        );

      console.log(
        "Downloaded temp file:",
        res.path()
      );

      // =========================
      // WAIT FOR FILE FLUSH
      // =========================

      await new Promise(resolve =>
        setTimeout(resolve, 3000)
      );

      // =========================
      // VERIFY FILE EXISTS
      // =========================

      const exists =
        await RNBlobUtil.fs.exists(tempPath);

      if (!exists) {

        throw new Error(
          "Downloaded file missing"
        );
      }

      // =========================
      // VERIFY FILE SIZE
      // =========================

      const stat =
        await RNBlobUtil.fs.stat(tempPath);

      console.log("FILE STAT:", stat);

      if (Number(stat.size) < 1000000) {

        throw new Error(
          "Corrupted audio file"
        );
      }

      // =========================
      // WRITE TAGS
      // =========================

      try {

        if (Mp3TagModule) {

          await Mp3TagModule.writeTags(
            tempPath,
            {
              title: formatSongTitle(item?.name),

              artist: formatSongTitle(
                item?.artists?.primary?.[0]?.name
              ),

              album: formatSongTitle(
                item?.album?.name
              ),

              year: item?.year?.toString(),

              imageUrl:
                item?.image?.[2]?.url,
            }
          );

          console.log(
            "Metadata written successfully"
          );
        }

      } catch (tagError) {

        console.log(
          "Metadata tagging failed:",
          tagError
        );
      }

      // =========================
      // COPY TO DOWNLOADS
      // =========================

      await RNBlobUtil.fs.cp(
        tempPath,
        finalPath
      );

      // =========================
      // DELETE TEMP FILE
      // =========================

      await RNBlobUtil.fs.unlink(
        tempPath
      );

      // =========================
      // MEDIA SCAN
      // =========================

      await RNBlobUtil.fs.scanFile([
        {
          path: finalPath,

          mime:
            extension === "m4a"
              ? "audio/mp4"
              : "audio/mpeg",
        },
      ]);

      // =========================
      // STOP LOADER
      // =========================

      setGlobalDownload({
        progress: 100,
        downloadedMB: 0,
        isDownloading: false,
      });

      // =========================
      // SHOW SUCCESS ANIMATION
      // =========================

      setShowDownloadAnim(true);

      Alert.alert(
        "Download Complete 🎵",
        `${safeName}.${extension} saved to Download folder`
      );

    } catch (error) {

      console.log(
        "handleDownload error:",
        error
      );

      setGlobalDownload({
        progress: 0,
        downloadedMB: 0,
        isDownloading: false,
      });

      Alert.alert(
        "Error",
        error?.message ||
        "Something went wrong"
      );
    }
  };




  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };


  const fetchLyrics = async (songid) => {
    if (!songid) return;

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
      console.log("lyriii", cleanLyrics);
      lyricsCache.current[songid] = cleanLyrics;
      setLyrics(cleanLyrics);

      sheet.current?.snapToIndex(0);

    } catch (error) {
      setLyrics("Lyrics Not Found");
      sheet.current?.snapToIndex(0);
    }
  };



  const GradientBackground = useCallback(
    ({ style }: BottomSheetBackgroundProps) => (
      <LinearGradient
        colors={[backgroundColors, "#000"]}
        style={[style, { borderRadius: 0 }]}
      />
    ),
    [backgroundColors]
  );

  const songDataMap = useMemo(() => {
    const map = {};
    songData.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [songData]);

  const mergedSongs = useMemo(() => {
    return rData.map(item => {
      const fullSong = songDataMap[item?.song?.id];

      return {
        ...item,
        fullSong, // 👈 contains downloadUrl, image, artists, etc
      };
    });
  }, [rData, songDataMap]);



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



  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }


  const ListHeader = () => (
    <View>
      <View style={styles.albumHeader}>
        <Image
          source={{ uri: dataSearch?.imageUrl }}
          style={styles.albumImage}
        />
      </View>
      <View style={styles.albumInfoCard}>
        <LinearGradient
          colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
          style={styles.albumInfoGradient}
        >
          <Text style={styles.albumLabel}>Radio</Text>
          <Text style={styles.albumName} numberOfLines={2}>
            {dataSearch?.id}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );

  const selectedSongDetails = songDetailsMap.current[currentSong?.id];

  return (
    <MenuProvider skipInstanceCheck >
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient colors={[gradientTop, 'rgba(0,0,0,0.98)', '#000']}
          locations={[0, 0.5, 1]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
              activeOpacity={0.8} className='w-10 mt-5'>
              <Ionicons name="arrow-back" size={22} color="white" />
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
            {loading ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View className='flex-1'>
                <FlatList
                  data={mergedSongs}
                  keyExtractor={(item) => item?.song?.id}
                  initialNumToRender={6}
                  maxToRenderPerBatch={6}
                  windowSize={10}
                  removeClippedSubviews={true}
                  ListHeaderComponent={<ListHeader />}
                  contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                  getItemLayout={(data, index) => ({
                    length: 75,
                    offset: 75 * index,
                    index,
                  })}
                  renderItem={({ item, index }) => (
                    <SongItem
                      song={item}
                      index={index}
                      currentSong={currentSong}
                      handlePlay={handlePlay}
                      handleDownload={handleDownload}
                      fetchLyrics={fetchLyrics}
                      songData={songData}
                      formatSongTitle={formatSongTitle}
                      handleshowqr={handleshowqr}
                    />
                  )}
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
              <TouchableOpacity
                onPress={() => sheetRef.current?.close()}
                style={{ width: 50 }}
                className='w-10 mt-0 ml-5'
              >
                <Entypo name="chevron-thin-down" size={30} color="white" />
              </TouchableOpacity>
              <BottomSheetScrollView
                contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* 🔥 NO FlatList, NO heavy components */}
                {currentSong && (
                  <View style={styles.songContainer}>

                    <Image
                      source={{ uri: currentSong.artwork }}
                      style={styles.songImages}
                      className="rounded-xl"
                    />
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
                          <View style={{ alignItems: 'flex-end', padding: 5 }}>
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

                )}
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
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
    </MenuProvider>
  )
}

export default Rresult;




// ====================== Modern Song Item ======================
const SongItem = React.memo(({ index, song, currentSong, handlePlay, handleDownload, fetchLyrics, handleshowqr, formatSongTitle }) => {
  const isPlaying = currentSong?.id === song?.song?.id;

  return (
    <View style={styles.songCard}>
      <TouchableOpacity onPress={() => handlePlay(song, index)} activeOpacity={0.8} >
        <View style={styles.songLeft}>
          {song?.artist === "<unknown>" ? (
            <Image
              source={require("../assets/musicphoto.jpg")}
              className="rounded-xl w-14 h-14"
              resizeMode="cover"
              style={[styles.songImage, { borderColor: isPlaying ? "#1DB954" : "transparent" }]}
            />
          ) : (
            <Image
              source={{ uri: song?.song?.image }}
              className="rounded-xl w-14 h-14"
              resizeMode="cover"
              style={[styles.songImage, { borderColor: isPlaying ? "#1DB954" : "transparent" }]}
            />
          )}
          <View style={styles.songText} >
            <View className="flex-row items-center">
              {/* Playing Animation: only shows for current song */}
              {currentSong?.id === song?.song?.id && (
                <LottieView
                  source={require("../assets/playing.json")}
                  style={{ width: 20, height: 20, marginRight: 5 }}
                  autoPlay
                  loop
                />
              )}

              {/* Song Title */}
              <Text
                style={[styles.songTitle, isPlaying && { color: "#1DB954", width: 145, }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatSongTitle(song?.song?.title)}
              </Text>
            </View>
            <Text style={styles.artist} numberOfLines={1}>
              {song?.song?.more_info?.music?.replace(/\s*\(.*?\)\s*/g, "")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.songRight}>
        <TouchableOpacity style={styles.playButton} onPress={() => handlePlay(song, index)} activeOpacity={0.8}>
          <FontAwesome
            name="play"
            size={20}
            color="black"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
        <View style={{ alignItems: 'flex-end', padding: 5, marginRight: -2 }}>
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
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(song?.song?.id)}>
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
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(song?.fullSong)}>
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
              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleshowqr(song?.fullSong)}>
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
  // Album Info
  albumInfoCard: {
    marginHorizontal: 0,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginTop: 20,
  },
  albumInfoGradient: {
    padding: 20,
  },
  albumLabel: {
    color: '#1DB954',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 3,
    marginBottom: 6,
  },
  albumName: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
    lineHeight: 32,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(29,185,84,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.25)',
  },
  metaBadgeText: {
    color: '#1DB954',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  albumHeader: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 4,
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
    marginTop: 20
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
    marginRight: -1,
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
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    width: 170,
  },
  artist: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
    width: 170
  },
  songRight: { flexDirection: 'row', alignItems: 'center' },
  songImagee: {
    width: 290,
    height: 290,
    display: 'flex',
    alignSelf: 'center',
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
    marginTop: 10,
  },
  textContainer: {
    alignSelf: 'flex-start',
    paddingLeft: 18,
    marginTop: -5,
    width: '100%',
  },
  songImages: {
    width: 260,
    height: 260,
  },
  songTitles: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.2,
    marginTop: 10,
    width: 280,
  },
  album: {
    fontSize: 16,
    color: 'grey',
    marginTop: 5,
  },
  artists: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
  icons: {
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    letterSpacing: 10,
    width: 50,
    position: 'absolute',
    marginLeft: 300,
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '2%',
  },
});

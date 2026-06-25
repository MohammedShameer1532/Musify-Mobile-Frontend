import { ActivityIndicator, Alert, FlatList, Image, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SearchContext } from '../contextProvider/searchContext';
import axios from 'axios';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { LegendList } from '@legendapp/list';
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AverageColorExtractor from '../common/AverageColorExtractor';
import LottieView from 'lottie-react-native';
import Entypo from "react-native-vector-icons/Entypo";
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Entypo';
import Clipboard from '@react-native-clipboard/clipboard';
import RNBlobUtil from "react-native-blob-util";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Music from '../common/Music';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import { decode } from 'html-entities';
import * as Progress from 'react-native-progress';
import { API_URL } from '@env';
import { NativeModules } from "react-native";


const Tartist = () => {
  const { dataSearch, setTokens, setPlaylistDatas, setQrdata } = useContext(SearchContext);
  const [backgroundColor, setBackgroundColor] = useState("rgb(30, 30, 30)");
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState([]);
  const [image, setImage] = useState('');
  const [albumData, setAlbumData] = useState([]);
  const [artistToken, setArtistToken] = useState(null);
  const id = dataSearch;
  const [topSongs, setTopSongs] = useState([]);
  const sheetRef = useRef(null);
  const currentSong = useActiveTrack();
  const songId = currentSong?.id;
  const [songData, setSongData] = useState([]);
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const sheet = useRef(null);
  const snapPoints = useMemo(() => ["100%"]);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const lyricsCache = useRef({});
  const [lyrics, setLyrics] = useState();
  const [copied, setCopied] = useState(false);
  const [backgroundColors, setBackgroundColors] = useState("rgb(30, 30, 30)");
  const [artistLoading, setArtistLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const songDetailsMap = useRef({});
  const [globalDownload, setGlobalDownload] = useState({
    progress: 0,
    isDownloading: false,
  });
  const { Mp3TagModule } = NativeModules;



  useEffect(() => {
    const fetchArtist = async () => {
      try {
        setArtistLoading(true);
        const res = await axios.get(
          `https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${id}&type=songs&n_song=50&category=&sort_order=&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
        );
        setImage(res?.data?.image);
        setArtist(res?.data);
        const bioUrl = res?.data?.urls?.bio;

        if (bioUrl) {
          const extractedToken = bioUrl
            .replace(/\/$/, '')
            .split('/')
            .pop(); // LlRWpHzy3Hk_

          setArtistToken(extractedToken);
        }
      } catch (error) {
        console.error('Error fetching artist:', error);
      } finally {
        setArtistLoading(false);
      }
    };

    fetchArtist();
  }, [id]);


  const fetchAlbumPage = useCallback(async (page = 0) => {
    if (!artistToken) return;

    try {
      setAlbumsLoading(true);

      const res = await axios.get(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${artistToken}&type=artist&p=${page}&n_song=50&n_album=50&ctx=wap6dot0&api_version=4&_format=json&_marker=0`
      );

      setTopSongs(res?.data?.topSongs || []);
      setAlbumData(res?.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAlbumsLoading(false); // ⚠️ fix: was true
    }
  }, [artistToken]);


  useEffect(() => {
    if (artistToken) {
      fetchAlbumPage(0);
    }
  }, [artistToken, fetchAlbumPage]);



  const preloadAllSongs = async () => {
    try {
      setLoading(true);
      const ids = topSongs.map(item => item?.id).join(",");
      if (!ids) return;
      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs?ids=${ids}`
      );
      setSongData(res.data.data);
    } catch (e) {
      console.error("Preload error:", e);
    } finally {
      setLoading(false); // ✅ always reset
    }
  };


  useEffect(() => {
    if (topSongs?.length > 0) {
      preloadAllSongs();
    }
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
      console.error('handlePlay error:', error);
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





  const handleDownload = async (item) => {

    try {


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


      // =========================
      // DETECT FILE TYPE
      // =========================

      const extension =
        songUrl.includes(".mp4")
          ? "m4a"
          : "mp3";


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

        }

      } catch (tagError) {

        console.error(
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

      console.error(
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
      lyricsCache.current[songid] = cleanLyrics;
      setLyrics(cleanLyrics);

      sheet.current?.snapToIndex(0);

    } catch (error) {
      setLyrics("Lyrics Not Found");
      sheet.current?.snapToIndex(0);
    }
  };


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


  const GradientBackground = ({ style }: BottomSheetBackgroundProps) => (
    <LinearGradient
      colors={[backgroundColors, "#000"]}
      style={[style, { borderRadius: 0 }]} // keep BottomSheet’s rounded corners
    />
  );

  const SCREEN_DATA = [{ id: 'screen-root' }];

  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }

  const selectedSongDetails = songDetailsMap.current[currentSong?.id];

  return (
    <MenuProvider skipInstanceCheck >
      <GestureHandlerRootView style={styles.container}>
        <LinearGradient t colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']}
          locations={[0, 0.5, 1]} style={styles.background}>
          <SafeAreaView style={styles.safeArea} className="flex-1 ">
            <View>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>
            </View>
            {image && (
              <AverageColorExtractor
                key={image}
                imageUrl={getHighResImage(image)}
                onColorExtracted={(color) => {
                  if (color) {
                    setBackgroundColor(color);
                  }
                }}
              />
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
            {(artistLoading || albumsLoading || loading) ? (
              <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
            ) : (
              <View >
                <LegendList
                  data={SCREEN_DATA}
                  renderItem={null}
                  keyExtractor={item => item.title}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  initialNumToRender={3}           // only render first 3 items initially
                  maxToRenderPerBatch={5}          // render in small batches
                  windowSize={5}                    // keep window size small
                  removeClippedSubviews={true}
                  maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                  ListHeaderComponent={
                    <View>
                      {/* Artist Image */}
                      <View style={{ position: 'relative', alignSelf: 'center' }}>
                        <Image
                          source={{ uri: getHighResImage(image) }}
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
                          }}
                        >
                          {albumData?.name || artist?.name}
                        </Text>
                      </View>

                      {/* TOP SONGS */}
                      {topSongs?.length > 0 && (
                        <Topsongs
                          topSongs={topSongs}
                          handlePlay={handlePlay}
                          getHighResImage={getHighResImage}
                          artistToken={artistToken}
                          setTokens={setTokens}
                          navigation={navigation}
                          image={image}
                          currentSongId={currentSong?.id}
                        />
                      )}

                      {/* DEDICATED PLAYLISTS */}
                      {artist?.dedicated_artist_playlist?.length > 0 && (
                        <DedicatedPlaylists
                          dedicatedData={artist.dedicated_artist_playlist}
                          getHighResImage={getHighResImage}
                          setPlaylistDatas={setPlaylistDatas}
                          navigation={navigation}
                        />
                      )}

                      {albumData?.topAlbums?.length > 0 && (
                        <FeaturedPlaylists
                          Featuredata={artist?.featured_artist_playlist}
                          getHighResImage={getHighResImage}
                          setPlaylistDatas={setPlaylistDatas}
                          navigation={navigation}
                        />
                      )}

                      {albumData?.topAlbums?.length > 0 && (
                        <TopAlbums
                          albumData={albumData?.topAlbums}
                          getHighResImage={getHighResImage}
                          setPlaylistDatas={setPlaylistDatas}
                          navigation={navigation}
                        />
                      )}
                      {artist?.singles?.length > 0 && (
                        <Singles
                          singlesdata={artist?.singles}
                          getHighResImage={getHighResImage}
                          setPlaylistDatas={setPlaylistDatas}
                          navigation={navigation}
                        />
                      )}

                      {artist?.latest_release?.length > 0 && (
                        <LatestRelease
                          latestdata={artist?.latest_release}
                          getHighResImage={getHighResImage}
                          setPlaylistDatas={setPlaylistDatas}
                          navigation={navigation}
                        />

                      )}

                    </View>

                  }
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

                  }}
                />
              )}
              <BottomSheetScrollView>
                <View style={styles.songContainer}>
                  {currentSong?.artwork ? (
                    <Image
                      source={{ uri: currentSong.artwork }}
                      style={styles.songImage}
                      className="rounded-xl"
                    />
                  ) : (
                    <View style={[styles.songImage, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
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
          </SafeAreaView>
        </LinearGradient>
      </GestureHandlerRootView>
    </MenuProvider>
  )
}

export default Tartist;




const Topsongs = React.memo(({ topSongs, getHighResImage, handlePlay, artistToken, setTokens, navigation, image, currentSongId }) => {
  const handleSeeAll = () => {
    setTokens({ token: artistToken, image: image });
    navigation.navigate('Artistsongs');
  };
  return (
    <View className='flex mt-5'>
      <View
        style={{
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={handleSeeAll}
          android_ripple={{
            color: 'rgba(255,255,255,0.15)',
            borderless: false,
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#000',


            // iOS fallback (pressed-in feel)
            ...(Platform.OS === 'ios' && {
              transform: [{ scale: pressed ? 0.97 : 1 }],
              opacity: pressed ? 0.9 : 1,
            }),
          })}
        >
          <View className='flex flex-row justify-between items-center   pr-5'>
            <Text className=" text-white ml-5 " style={{
              color: 'white', fontSize: 20
              , fontFamily: 'Poppins-Bold',
              paddingVertical: 6,
            }}>
              Top Songs
            </Text>
            <MaterialCommunityIcons name="chevron-down-box" size={25} color="white" />
          </View>
        </Pressable>
      </View >
      <View style={{ height: 170 }}>
        <LegendList
          horizontal
          recycleItems
          data={topSongs}
          extraData={currentSongId}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
          estimatedItemSize={160}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => handlePlay(item, index)} >
              <View className="gap-2 mt-4 " >
                <Image
                  source={{ uri: getHighResImage(item?.image) }}
                  style={{
                    width: 120,
                    height: 120,
                    resizeMode: 'cover',
                    borderRadius: 12,
                  }}
                  className="rounded-xl"
                />
                <View className="flex-row items-center">
                  {/* Playing Animation: only shows for current song */}
                  {currentSongId === item?.id && (
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
                      color: currentSongId === item?.id ? "limegreen" : "white",
                      fontSize: 12,
                      lineHeight: 16,
                      width: 100,
                      marginTop: 6,
                      fontFamily: 'Poppins-Regular',
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item?.title ? item?.title?.replace(/\s*\(.*?\)\s*/g, "") : "Unknown"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity activeOpacity={0.8}
              onPress={handleSeeAll}>
              <View style={styles.iconCard}>
                <FontAwesome6
                  name="circle-arrow-right"
                  size={40}
                  color="white"
                />
                <Text>load more</Text>
              </View>
            </TouchableOpacity>
          } />
      </View>
    </View >
  );
});




const DedicatedPlaylists = React.memo(({ getHighResImage, setPlaylistDatas, navigation, dedicatedData }) => {
  const handlePlaylist = (item) => {
    setPlaylistDatas(item.id);
    navigation.navigate('Playlist');
  };
  return (
    <View className='flex '>
      <View className='flex flex-row justify-between items-center  mt-10 pr-5'>
        <Text className=" text-white ml-5 " style={{
          color: 'white', fontSize: 20, fontFamily: 'Poppins-Bold',
          paddingVertical: 6,
        }}>
          Dedicated Playlists
        </Text>
      </View>
      <LegendList
        horizontal={true}
        recycleItems
        data={dedicatedData}
        estimatedItemSize={130}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlaylist(item)}>
            <View className="gap-2 mt-5">
              <Image
                source={{ uri: getHighResImage(item?.image) }}
                style={styles.decImages}
                className="rounded-xl"
              />
              <Text
                style={{ color: 'white', fontSize: 12, width: 120, fontFamily: 'Poppins-Regular', }}
                numberOfLines={3}
              >
                {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
});



const FeaturedPlaylists = React.memo(({ getHighResImage, setPlaylistDatas, navigation, Featuredata }) => {
  const handlePlaylist = (item) => {
    setPlaylistDatas(item.id);
    navigation.navigate('Playlist');
  };
  return (
    <View className='flex '>
      <View className='flex flex-row justify-between items-center  mt-10 pr-5'>
        <Text className=" text-white ml-5 " style={{
          color: 'white', fontSize: 20, fontFamily: 'Poppins-Bold',
          paddingVertical: 6,
        }}>
          Featured Playlists
        </Text>
      </View>
      <LegendList
        horizontal={true}
        recycleItems
        data={Featuredata}
        estimatedItemSize={130}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePlaylist(item)}>
            <View className="gap-2 mt-5">
              <Image
                source={{ uri: getHighResImage(item?.image) }}
                style={styles.decImages}
                className="rounded-xl"
              />
              <Text
                style={{ color: 'white', fontSize: 12, width: 120, fontFamily: 'Poppins-Regular', }}
                numberOfLines={3}
              >
                {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
});




const TopAlbums = React.memo(({ getHighResImage, setPlaylistDatas, navigation, albumData }) => {
  const handlePlaylist = (item) => {
    setPlaylistDatas(item.id);
    navigation.navigate('Tresult');
  };
  return (
    <View className='flex '>
      <View className='flex flex-row justify-between items-center  mt-10 pr-5'>
        <Text className=" text-white ml-5 " style={{
          color: 'white', fontSize: 20, fontFamily: 'Poppins-Bold',
          paddingVertical: 6,
        }}>
          Top Albums
        </Text>
      </View>
      <LegendList
        horizontal={true}
        recycleItems
        data={albumData}
        estimatedItemSize={130}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlaylist(item)}>
            <View className="gap-2 mt-5">
              <Image
                source={{ uri: getHighResImage(item?.image) }}
                style={styles.decImages}
                className="rounded-xl"
              />
              <Text
                style={{ color: 'white', fontSize: 12, width: 120, fontFamily: 'Poppins-Regular', }}
                numberOfLines={3}
              >
                {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
});



const Singles = React.memo(({ getHighResImage, setPlaylistDatas, navigation, singlesdata }) => {
  const handlePlaylist = (item) => {
    setPlaylistDatas(item.id);
    navigation.navigate('Tresult');
  };
  return (
    <View className='flex '>
      <View className='flex flex-row justify-between items-center  mt-10 pr-5'>
        <Text className=" text-white ml-5 " style={{
          color: 'white', fontSize: 20, fontFamily: 'Poppins-Bold',
          paddingVertical: 6,
        }}>
          Singles
        </Text>
      </View>
      <LegendList
        horizontal={true}
        recycleItems
        data={singlesdata}
        estimatedItemSize={130}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlaylist(item)}>
            <View className="gap-2 mt-5">
              <Image
                source={{ uri: getHighResImage(item?.image) }}
                style={styles.decImages}
                className="rounded-xl"
              />
              <Text
                style={{ color: 'white', fontSize: 12, width: 120, fontFamily: 'Poppins-Regular', }}
                numberOfLines={3}
              >
                {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
});





const LatestRelease = React.memo(({ getHighResImage, setPlaylistDatas, navigation, latestdata }) => {
  const handlePlaylist = (item) => {
    setPlaylistDatas(item.id);
    navigation.navigate('Tresult');
  };
  return (
    <View className='flex '>
      <View className='flex flex-row justify-between items-center  mt-10 pr-5'>
        <Text className=" text-white ml-5 " style={{
          color: 'white', fontSize: 20, fontFamily: 'Poppins-Bold',
          paddingVertical: 6,
        }}>
          Latest Release
        </Text>
      </View>
      <LegendList
        horizontal={true}
        recycleItems
        data={latestdata}
        estimatedItemSize={130}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => <View style={{ width: 25 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePlaylist(item)}>
            <View className="gap-2 mt-5">
              <Image
                source={{ uri: getHighResImage(item?.image) }}
                style={styles.decImages}
                className="rounded-xl"
              />
              <Text
                style={{ color: 'white', fontSize: 12, width: 120, fontFamily: 'Poppins-Regular', }}
                numberOfLines={3}
              >
                {item?.title?.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
  },
  decImages: {
    width: 120,
    height: 120,
    resizeMode: 'cover'

  },
  songImagee: {
    width: 260,
    height: 260,
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
  songImage: {
    width: 300,
    height: 300,
  },
  songTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    marginBottom: -5,
    width: 180,
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
    fontFamily: 'Poppins-Regular',
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

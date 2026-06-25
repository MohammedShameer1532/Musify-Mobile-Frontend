import React, { useEffect, useContext, useState, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AverageColorExtractor from '../common/AverageColorExtractor';
import axios from 'axios';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import LinearGradient from 'react-native-linear-gradient';
import TrackPlayer from 'react-native-track-player';
import Music from '../common/Music';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { Alert, PermissionsAndroid, Platform } from "react-native";
import RNBlobUtil from "react-native-blob-util";
import Clipboard from '@react-native-clipboard/clipboard';
import { decode } from 'html-entities';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { NativeModules } from "react-native";
import * as Progress from 'react-native-progress';
import LottieView from 'lottie-react-native';


const Song = () => {
  const [copied, setCopied] = useState(false);
  const navigation = useNavigation();
  const [backgroundColor, setBackgroundColor] = useState('rgb(30, 30, 30)');
  const [loading, setLoading] = useState(true);
  const [songData, setSongData] = useState([]);
  const [lyrics, setLyrics] = useState();
  const { setCurrentSong, dataSearch, setCurrentIndex, setSongsList, currentSong, setQrdata } = useContext(SearchContext);
  const id = dataSearch;
  const songId = currentSong?.id;
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const songDetailsMap = useRef({});
  const lyricsCache = useRef({});
  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }
  const sheet = useRef(null);
  const [globalDownload, setGlobalDownload] = useState({
    progress: 0,
    isDownloading: false,
  });
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const { Mp3TagModule } = NativeModules;


  const matchIds = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs?ids=${id}`
      );

      const songs = res.data?.data || [];
      setSongData(songs); // always array
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    matchIds(id);
  }, [id]);



  useEffect(() => {
    if (songData.length > 0) {
      handlePlay(); // Call after songData is available
    }
  }, [songData]);


  const handlePlay = async () => {
    if (!songData.length) return;

    const item = songData[0];

    // store details
    songDetailsMap.current[item.id] = item;

    const track = {
      id: item.id,
      url: item.downloadUrl?.[4]?.url,
      title: item.name,
      artist: item.artists?.primary?.[0]?.name,
      artwork: item.image?.[2]?.url,
      album: item?.album?.name,
      year: item?.year,
    };

    setCurrentSong(track);
    setCurrentIndex(0); // ✅ FIXED
    setSongsList(songData);

    await TrackPlayer.reset();
    await TrackPlayer.add([track]);
    await TrackPlayer.play();
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



  const selectedSongDetails = songDetailsMap.current[currentSong?.id];


  return (
    <MenuProvider skipInstanceCheck>
      <LinearGradient colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']}
        locations={[0, 0.5, 1]} style={styles.background}>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          {songData.length > 0 && (
            <AverageColorExtractor
              imageUrl={songData[0]?.image[2]?.url}
              onColorExtracted={(color) => {
                setBackgroundColor(color);
              }}
            />
          )}
          {loading ? (
            <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
          ) : (
            <FlatList
              data={songData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.songContainer} >
                  <Image source={{ uri: songData[0]?.image[2]?.url }} style={styles.albumImage} className="rounded-xl" />
                  <View
                    style={{
                      marginTop: 20,
                      paddingVertical: 15,
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
                            {formatSongTitle(item?.album?.name)}
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
                            {formatSongTitle(item?.name)}
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
                            {formatSongTitle(item?.artists?.all?.[0]?.name)}
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
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => fetchLyrics(item?.id)}>
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
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleDownload(item)}>
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
                              <MenuOption customStyles={{ optionWrapper: { activeOpacity: 0.6 } }} onSelect={() => handleshowqr(item)}>
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
              )}
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
    </MenuProvider>
  );
};

export default Song;

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
  albumImage: {
    width: 260,
    height: 260,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    marginTop: -30,
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
    marginRight: 0,
  },
  // Song item
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
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
    marginTop: 0,
    width: '100%',
  },
  songTitle: {
    fontSize: 25,
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
});

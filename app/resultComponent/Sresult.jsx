import React, { useEffect, useContext, useState, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Text, Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AverageColorExtractor from '../common/AverageColorExtractor';
import axios from 'axios';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import LinearGradient from 'react-native-linear-gradient';
import TrackPlayer, { Capability } from 'react-native-track-player';
import Music from '../common/Music';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Entypo';
import { Alert, PermissionsAndroid, Platform } from "react-native";
import RNBlobUtil from "react-native-blob-util";
import { SmoothSheet } from 'react-native-smooth-sheet';
import Clipboard from '@react-native-clipboard/clipboard';
import { decode } from 'html-entities';
import { usePlaylistSheetStore } from '../store/playlistSheetStore';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import { API_URL } from '@env';
import * as Progress from 'react-native-progress';

const Sresult = () => {
  const [copied, setCopied] = useState(false);
  const sheet = useRef(null);
  const lyricsSnapPoints = useMemo(() => ["50%", "100%"], []);
  const navigation = useNavigation();
  const [backgroundColor, setBackgroundColor] = useState('rgb(30, 30, 30)');
  const [loading, setLoading] = useState(true);
  const [songData, setSongData] = useState([]);
  const [lyrics, setLyrics] = useState();
  const { setCurrentSong, dataSearch, setCurrentIndex, setSongsList, currentSong, setQrdata } = useContext(SearchContext);
  const id = dataSearch;
  console.log('songData', dataSearch);
  console.log('currentSong', currentSong);
  const songId = currentSong?.id;
  console.log("siiii", songId);
  const openSheet = usePlaylistSheetStore((state) => state.openSheet);
  const lyricsCache = useRef({});
  const songDetailsMap = useRef({});
  const [showDownloadAnim, setShowDownloadAnim] = useState(false);
  const [globalDownload, setGlobalDownload] = useState({
    progress: 0,
    isDownloading: false,
  });



  const songIds = async (id) => {
    try {
      setLoading(true);
      const responseData = await axios.get(`https://saavn.sumit.co/api/songs?ids=${id}`);
      const res = responseData?.data.data[0];
      setSongData([res])
      console.log('resss', res);
      (res);
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (error) {
      console.error('Error fetching:', error);
      setLoading(false);
    }
  }
  console.log('songData', songData);

  useEffect(() => {
    songIds(id);
  }, []);


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


  useEffect(() => {
    if (songData.length > 0) {
      handlePlay(); // Call after songData is available
    }
  }, [songData]);

  const handlePlay = async () => {
    if (songData.length > 0) {
      const item = songData[0]; // Make sure you're using the correct item
      songDetailsMap.current[item.id] = item;
      const track = {
        id: item?.id,
        url: item?.downloadUrl[4]?.url,
        title: formatSongTitle(item?.name),
        artist: item?.artists?.primary[0]?.name,
        artwork: item?.image[2]?.url,
      };

      setCurrentSong(track);
      setCurrentIndex(item);
      setSongsList();

      // Reset and add track to TrackPlayer
      await TrackPlayer.reset();
      await TrackPlayer.add([track]);
      await TrackPlayer.play();

    }
  };


  // const handleDownload = async (item) => {
  //   try {
  //     // Permission for Android < 13
  //     if (Platform.OS === "android" && Platform.Version < 33) {
  //       const granted = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  //         {
  //           title: "Storage Permission",
  //           message: "App needs storage access to save songs.",
  //           buttonNeutral: "Ask Me Later",
  //           buttonNegative: "Cancel",
  //           buttonPositive: "OK",
  //         }
  //       );
  //       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
  //         Alert.alert("Permission denied", "Cannot download without permission");
  //         return;
  //       }
  //     }

  //     const safeName = (formatSongTitle(item?.name) || "Song").replace(/[^\w\s-]/g, "_");
  //     const downloadDir = `/storage/emulated/0/Download`;
  //     const destPath = `${downloadDir}/${safeName}.mp3`;

  //     setShowDownloadAnim(true);

  //     RNBlobUtil.config({
  //       fileCache: true,
  //       appendExt: "mp3",
  //     })
  //       .fetch(
  //         "POST",
  //         `${API_URL}/api/download`,
  //         { "Content-Type": "application/json" },
  //         JSON.stringify({
  //           mp3Url: item?.downloadUrl[4]?.url,
  //           imageUrl: item?.image[2]?.url,
  //           title: formatSongTitle(item?.name),
  //           artist: formatSongTitle(item?.artists?.primary?.[0]?.name),
  //           album: formatSongTitle(item?.album?.name),
  //           year: item?.year,
  //         })
  //       )
  //       .then(async (res) => {
  //         try {
  //           const tempPath = res.path();
  //           console.log("✅ Temp file:", tempPath);

  //           // ✅ Check if destination file already exists and delete it
  //           const exists = await RNBlobUtil.fs.exists(destPath);
  //           if (exists) {
  //             await RNBlobUtil.fs.unlink(destPath);
  //             console.log("🗑 Deleted existing file at destPath");
  //           }

  //           // ✅ Ensure Download directory exists
  //           const dirExists = await RNBlobUtil.fs.exists(downloadDir);
  //           if (!dirExists) {
  //             await RNBlobUtil.fs.mkdir(downloadDir);
  //             console.log("📁 Created Download directory");
  //           }

  //           // ✅ Use cp instead of mv (more reliable on Android)
  //           await RNBlobUtil.fs.cp(tempPath, destPath);

  //           // ✅ Clean up temp file
  //           await RNBlobUtil.fs.unlink(tempPath);

  //           // ✅ Trigger media scanner so it appears in music apps
  //           await RNBlobUtil.fs.scanFile([{ path: destPath, mime: "audio/mpeg" }]);

  //           console.log("✅ Saved to:", destPath);
  //           // LottieView hides via onAnimationFinish

  //         } catch (moveErr) {
  //           console.error("Move/Copy error:", moveErr);
  //           setShowDownloadAnim(false);
  //           Alert.alert("Error", "Failed to save file: " + moveErr.message);
  //         }
  //       })
  //       .catch((err) => {
  //         console.error("Fetch error:", err);
  //         setShowDownloadAnim(false);
  //         Alert.alert("Error", "Download failed: " + err.message);
  //       });

  //   } catch (error) {
  //     console.error("Download error:", error);
  //     setShowDownloadAnim(false);
  //     Alert.alert("Error", "Something went wrong");
  //   }
  // };



  const handleDownload = async (item) => {
    try {
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



  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };


  const handleshowqr = (item) => {
    setQrdata(item);
    openSheet();
  }

  const selectedSongDetails = songDetailsMap.current[currentSong?.id];

  return (
    <MenuProvider skipInstanceCheck >
      <LinearGradient colors={[backgroundColor, 'rgba(0,0,0,0.98)', '#000']}
        locations={[0, 0.5, 1]} style={styles.background}>
        {console.log('Applying Background Color:', backgroundColor)}
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={25} color="white" />
          </TouchableOpacity>
          {songData.length > 0 && (
            <AverageColorExtractor
              imageUrl={songData[0]?.image[2]?.url}
              onColorExtracted={(color) => {
                setBackgroundColor(color);
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
          {loading ? (
            <ActivityIndicator size="large" color="white" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }} />
          ) : (
            <FlatList
              data={songData}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.songContainer} key={index}>
                  <Image source={{ uri: item?.image[2]?.url }} style={styles.songImage} className="rounded-xl" />
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
                              <MaterialCommunityIcons name="dots-vertical" color="#fff" size={30} />
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
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold' }}>Lyrics</Text>
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
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 12, fontFamily: 'Poppins-Bold' }}>Download</Text>
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
                                  <Text style={{ color: 'white', fontSize: 12, marginLeft: 10, fontFamily: 'Poppins-Bold' }}>QR Code</Text>
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
  )
}

export default Sresult;


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

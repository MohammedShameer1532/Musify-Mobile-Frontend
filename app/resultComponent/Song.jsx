import React, { useEffect, useContext, useState, useRef } from 'react';
import { View, FlatList, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Text, Button, ScrollView } from 'react-native';
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
import TrackPlayer, { Capability } from 'react-native-track-player';
import Music from '../common/Music';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Entypo';
import { Alert, PermissionsAndroid, Platform } from "react-native";
import RNBlobUtil from "react-native-blob-util";
import { SmoothSheet } from 'react-native-smooth-sheet';
import Clipboard from '@react-native-clipboard/clipboard';



const Song = () => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef(null);
  const navigation = useNavigation();
  const [backgroundColor, setBackgroundColor] = useState('rgb(30, 30, 30)');
  const [loading, setLoading] = useState(true);
  const [songData, setSongData] = useState([]);
  const [lyrics, setLyrics] = useState();
  const { setCurrentSong, dataSearch, setCurrentIndex, setSongsList, currentSong } = useContext(SearchContext);
  const id = dataSearch;
  console.log('songData', dataSearch);
  console.log('currentSong', currentSong);
  const songId = currentSong?.id;
  console.log("siiii", songId);



  const matchIds = async (id) => {
    try {
      let responseData;
      setLoading(true);
      const apiUrl1 = await axios.get(`https://musify-api-inky.vercel.app/api/songs?ids=${id}`);
      responseData = apiUrl1.data;
      const res = responseData.data;
      console.log('resss', res);
      setSongData(res);
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (error) {
      console.error('Error fetching:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    matchIds(id);
  }, [id]);

  useEffect(() => {
    async function setupPlayer() {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        stopWithApp: true,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        jumpInterval: 10,
      });
    }

    setupPlayer();
  }, []);
  
  useEffect(() => {
    if (songData.length > 0) {
      handlePlay(); // Call after songData is available
    }
  }, [songData]);

  const handlePlay = async () => {
    if (songData.length > 0) {
      const item = songData[0]; // Make sure you're using the correct item

      const track = {
        id: item?.id,
        url: item?.downloadUrl[4]?.url,
        title: item?.name,
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
          Alert.alert("Download Complete", "Saved in Downloads folder.");
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
      console.log("lyriii", cleanLyrics);
      setVisible(true);
    } catch (error) {
      console.log(error);
      setLyrics("Failed to load lyrics");
      setVisible(true);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(lyrics || "");
    setCopied(true);

    // Reset back to copy icon after 2 sec
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <MenuProvider>
      <LinearGradient colors={[backgroundColor, '#000']} style={styles.background}>
        {console.log('Applying Background Color:', backgroundColor)}
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={() => navigation.goBack()} className='w-10 mt-5'>
            <Ionicons name="arrow-back" size={30} color="white" style={styles.backIcon} />
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
              renderItem={({ item, index }) => (
                <View style={styles.songContainer} key={index}>
                  <Image source={{ uri: item?.image[2]?.url }} style={styles.songImage} className="rounded-xl" />
                  <View style={styles.textContainer}>
                    <TouchableOpacity  className="w-[100%]">
                      <Text style={styles.songTitle}>{item?.name.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                      <Text style={styles.album}>{item?.album?.name.replace(/\s*\(.*?\)\s*/g, '')}</Text>
                      <Text style={styles.artist}>{item?.artists?.all[0]?.name}</Text>
                    </TouchableOpacity>
                    <View style={styles.icons}>
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
                            <MenuOption onSelect={() => handleDownload(item?.downloadUrl[4]?.url, `${item?.name}.mp3`)}>
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
              )}
            />
          )}
          <View style={{ flex: 1 }}>
            <SmoothSheet
              ref={sheetRef}
              isVisible={visible}
              onClose={() => setVisible(false)}
              snapPoint={0.5}
              paddingHorizontal={15}
              borderTopLeftRadius={50}
              borderTopRightRadius={50}
              theme="#000" // background color
              disableDrag={false}
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
              <TouchableOpacity style={styles.clearIcon} onPress={() => sheetRef.current?.close()}>
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
              <ScrollView style={{ maxHeight: 400 }}>
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
              </ScrollView>

            </SmoothSheet>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </MenuProvider>
  );
};

export default Song;

const styles = StyleSheet.create({
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
    width: '100%',
  },
  songImage: {
    width: 290,
    height: 290,
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

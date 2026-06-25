import { ActivityIndicator, Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getAuth } from '@react-native-firebase/auth';
import { FlatList } from 'react-native-gesture-handler';
import Feather from 'react-native-vector-icons/Feather';
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from 'react-native-popup-menu';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SearchContext } from '../../contextProvider/searchContext';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import { API_URL } from '@env';

const AddPlaylist = () => {
  const [loading, setLoading] = useState(false);
  const [playlistres, setplaylistres] = useState([]);
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState("");
  const { setAddtoplaylist } = useContext(SearchContext)
  const [name, setName] = useState('');
  const bottomSheetRefs = useRef(null);
  const snapPoints = useMemo(() => ['60%'], []);
  const [updating, setUpdating] = useState(false)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [playlistname, setPlaylistname] = useState("");
  const [creating, setCreating] = useState(false);



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


  const getPlaylist = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      setLoading(true);

      const res = await axios.get(
        `${API_URL}/api/users/${user.uid}/playlists-with-songs`
      );
      setplaylistres(res?.data?.playlists)

    } catch (error) {
      console.error('API ERROR:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };




  useEffect(() => {
    getPlaylist();
  }, []);

  const updateplaylist = (playlist) => {
    setSelectedPlaylistId(playlist.id);
    setName(playlist.name);
    bottomSheetRefs.current?.present();
  };


  const handleupdateplaylist = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user || !name) return;

      setUpdating(true);

      await axios.put(
        `${API_URL}/api/users/${user.uid}/playlists/${selectedPlaylistId}`,
        { name }
      );

      // ✅ update state first
      setplaylistres(prev =>
        prev.map(item =>
          item.id === selectedPlaylistId
            ? { ...item, name }
            : item
        )
      );

      setName("");
      setSelectedPlaylistId(null);

    } catch (error) {
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };


  const handletoplaylist = (id) => {
    setAddtoplaylist(id);
    navigation.navigate('Viewplaylist')
  }


  const createPlaylist = async () => {
    try {
      const user = getAuth().currentUser;

      if (!user || !playlistname.trim()) return;

      setCreating(true);

      const res = await axios.post(`${API_URL}/api/playlists`, {
        userId: user.uid,
        name: playlistname.trim(),
      });

      // add new playlist to list instantly
      setplaylistres(prev => [
        { ...res.data.playlist, songs: [] },
        ...prev
      ]);
      getPlaylist();
      setPlaylistname("");
      setVisible(false);

    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setVisible(true);
  };



  const handledeleteplaylist = async (PlaylistId) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      const res = await axios.delete(`${API_URL}/api/users/${user.uid}/playlists/${PlaylistId}`);
      getPlaylist();
    } catch (error) {
      console.error(error);

    }
  }


  const filteredPlaylists = playlistres.filter(
    item => item?.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      // trigger filtering logic here
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchText]);

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={{ flex: 1 }} className='bg-stone-950'>
        {/* <MenuProvider> */}
        {/* <LinearGradient  style={styles.container}> */}
        {/* Header */}
        <View>
          <View style={styles.header}>
            <AnimatedIcon focused={true}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} >
                <Ionicons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>
            </AnimatedIcon>
            <Text style={styles.title}>My Playlist</Text>
            <View style={{ width: 40 }} />
          </View>
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
        ) : (
          <View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#b3b3b3" />
              <TextInput
                placeholder="Find a playlist"
                placeholderTextColor="#b3b3b3"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={25} color="gray" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredPlaylists}
              extraData={playlistres}
              keyExtractor={(item) => item.id?.toString()}
              contentContainerStyle={{ paddingBottom: 250 }}
              renderItem={({ item }) => (
                <View style={styles.playlistItem}>
                  <TouchableOpacity style={styles.playlistLeft} activeOpacity={0.7} onPress={() => handletoplaylist(item?.id)}>
                    <View style={styles.playlistCover}>
                      {item?.songs?.length > 0 ? (
                        (() => {
                          const images =
                            item.songs.length >= 4
                              ? item.songs.slice(0, 4)
                              : item.songs.slice(0, 2);

                          return images.map((song, index) => (
                            <Image
                              key={index}
                              source={{ uri: song.artwork }}
                              style={[
                                styles.gridImage,
                                images.length === 1 && styles.singleImage,
                                images.length === 2 && styles.twoImage,
                              ]}
                            />
                          ));
                        })()
                      ) : (
                        <Image
                          source={require('../../assets/musicphoto.jpg')}
                          style={styles.singleImage}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playlistName}>{item?.name}</Text>
                      <Text style={styles.playlistMeta}>{item?.songs?.length}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.Menu}>
                    <View style={{ alignItems: 'flex-end', padding: 0 }}>
                      <Menu>
                        <MenuTrigger>
                          <AnimatedIcon focused={true}>
                            <View style={styles.menuTrigger}>
                              <MaterialCommunityIcons name="dots-vertical" color="#fff" size={26} />
                            </View>
                          </AnimatedIcon>
                        </MenuTrigger>
                        <MenuOptions
                          customStyles={{
                            optionsContainer: {
                              paddingVertical: 8,
                              borderRadius: 12,
                              backgroundColor: '#2a2a2a',   // darker, modern background
                              marginTop: 5,
                              width: 170,
                              shadowColor: '#000',
                              shadowOpacity: 0.2,
                              shadowRadius: 6,
                              elevation: 6,
                            },
                            optionWrapper: {
                              paddingVertical: 12,
                              paddingHorizontal: 14,
                              flexDirection: 'row',
                              alignItems: 'center',
                            },
                            optionTouchable: {
                              activeOpacity: 0.6, // subtle press feedback
                            },
                            optionText: {
                              color: '#fff',
                              fontSize: 15,
                              fontWeight: '500',
                              marginLeft: 12,
                            },
                          }}
                        >
                          <MenuOption onSelect={() => updateplaylist(item)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Feather name="edit" color="#1DB954" size={21} />
                              <Text style={{
                                fontSize: 13,
                                color: 'white',
                                marginLeft: 9,
                                fontFamily: 'Poppins-Bold',
                              }}>Rename Playlist</Text>
                            </View>
                          </MenuOption>
                          <View style={{
                            height: 1,
                            backgroundColor: '#444',  // softer, modern divider
                            marginVertical: 6,
                            marginHorizontal: 10,
                            width: 'auto'
                          }} />
                          <MenuOption onSelect={() => handledeleteplaylist(item?.id)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <MaterialIcons name="delete-outline" color="#ff4d4d" size={24} />
                              <Text style={{
                                fontSize: 13,
                                color: 'white',
                                marginLeft: 7,
                                fontFamily: 'Poppins-Bold',
                              }}>Remove Playlist</Text>
                            </View>
                          </MenuOption>
                        </MenuOptions>
                      </Menu>
                    </View>
                  </View>
                </View>
              )}
            />
            <TouchableOpacity
              style={styles.newPlaylistButton}
              onPress={openCreateModal}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.newPlaylistText}>New playlist</Text>
            </TouchableOpacity>
          </View>
        )}
        <BottomSheetModal
          ref={bottomSheetRefs}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetHandle}
        >
          <View style={styles.sheetContainer}>

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Rename Playlist</Text>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => bottomSheetRefs.current?.dismiss()}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSubtitle}>
              Update your playlist name
            </Text>

            <TextInput
              style={styles.sheetInput}
              placeholder="Enter playlist name"
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
            />

            <TouchableOpacity
              style={[
                styles.sheetButton,
                !name && styles.disabledButton
              ]}
              disabled={!name || updating}
              onPress={async () => {
                Keyboard.dismiss();
                bottomSheetRefs.current?.dismiss();
                await handleupdateplaylist();

              }}
            >
              <Text style={styles.sheetButtonText}>
                {/* {updating ? "Updating..." : "Save Changes"} */}
                Save Changes
              </Text>
            </TouchableOpacity>

          </View>
        </BottomSheetModal>
        <Modal
          transparent
          visible={visible}
          animationType="slide"
          onRequestClose={() => setVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ width: "100%", justifyContent: "center", alignItems: "center" }}
            >
              <Pressable
                style={styles.alertBox}
                onPress={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setVisible(false)}
                >
                  <Ionicons name="close" size={22} color="#000" />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>Create Playlist</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter playlist name..."
                  placeholderTextColor="#888"
                  value={playlistname}
                  onChangeText={setPlaylistname}
                />

                <TouchableOpacity
                  style={[
                    styles.button,
                    !playlistname.trim() && styles.disabledButton
                  ]}
                  disabled={!playlistname.trim() || creating}
                  onPress={async () => {
                    Keyboard.dismiss();
                    await createPlaylist();
                  }}
                >
                  <Text style={styles.buttonText}>
                    {creating ? "Creating..." : "Continue"}
                  </Text>
                </TouchableOpacity>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
        {/* </LinearGradient> */}
        {/* </MenuProvider> */}
      </SafeAreaView >
    </BottomSheetModalProvider>
  )
}

export default AddPlaylist

const styles = StyleSheet.create({
  menuTrigger: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Menu: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  sheetBackground: {
    backgroundColor: '#16161A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  sheetHandle: {
    backgroundColor: '#444',
    width: 50,
  },

  sheetContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
  },

  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },

  sheetSubtitle: {
    color: '#9e9e9e',
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetInput: {
    backgroundColor: '#242424',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },

  sheetButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },

  sheetButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  optionWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
  },
  backIconContainer: {
    alignSelf: 'flex-end',   // pushes it to the right
    marginRight: 20,         // spacing from edge
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // softer overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '92%',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20, // more rounded
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
    fontFamily: 'Poppins-Bold',
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    borderRadius: 25, // pill-style
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#b3b3b3',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 8,
    height: 45,
    marginBottom: 20,
    marginTop: 12,
  },

  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },

  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#1e1e1e',
  },
  playlistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // very important
  },
  playlistCover: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridImage: {
    width: '50%',
    height: '50%',
  },

  singleImage: {
    width: '100%',
    height: '100%',
  },

  twoImage: {
    width: '50%',
    height: '100%',
  },

  playlistName: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },

  playlistMeta: {
    color: '#b3b3b3',
    fontSize: 13,
    marginTop: 3,
    fontFamily: 'Poppins-Bold',
  },

  newPlaylistButton: {
    position: 'absolute',
    bottom: 190,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 30,
    elevation: 20,
  },
  newPlaylistText: {
    marginLeft: 8,
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
})
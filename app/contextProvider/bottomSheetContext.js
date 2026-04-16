import React, { createContext, useContext, useRef, useMemo, useState, useEffect } from 'react';
import { Image, Keyboard, Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';
import { FlatList, Text } from 'react-native-gesture-handler';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SearchContext } from './searchContext';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { API_URL } from '@env';
const BottomSheetContext = createContext();


export function BottomSheetProvider({ children }) {
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['100%'], []);
  const [playlistname, setPlaylistname] = useState("");
  const [creating, setCreating] = useState(false);
  const [getplaylist, setGetplaylist] = useState([]);
  const [visible, setVisible] = useState(false);
  const { addtoplaylist } = useContext(SearchContext);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  console.log("context", addtoplaylist);

  const openSheet = async () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const getlist = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user || !addtoplaylist?.id) return;

      setLoading(true);

      const res = await axios.get(
        `${API_URL}/api/users/${user.uid}/playlists?songId=${addtoplaylist.id}`
      );

      setGetplaylist(res.data.playlists);
      console.log('getlist', res);

    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!addtoplaylist?.id) return;
    // 🔥 Reset immediately to prevent old ticks flashing
    setGetplaylist([]);
    getlist();
  }, [addtoplaylist]);


  const createPlaylist = async () => {
    try {
      const users = getAuth().currentUser;
      if (!users || !playlistname.trim()) return;

      setCreating(true);

      await axios.post(`${API_URL}/api/playlists`, {
        userId: users.uid,
        name: playlistname.trim(),
      });

      await getlist();

      // ✅ Close modal AFTER success
      setVisible(false);

      // ✅ Clear input AFTER success
      setPlaylistname("");

    } catch (error) {
      console.error(error.response?.data || error.message);
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setVisible(true);
  };

  const handleAddtoplaylist = async (playlistId) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      // optimistic update
      setGetplaylist(prev =>
        prev.map(p =>
          p.id === playlistId
            ? { ...p, hasSongExist: true }
            : p
        )
      );

      await axios.post(`${API_URL}/api/playlists/${playlistId}/add`, {
        userId: user.uid,
        songId: addtoplaylist.id,
        title: addtoplaylist.title,
        artist: addtoplaylist.artist,
        artwork: addtoplaylist.artwork,
        url: addtoplaylist.url,
      });
      await getlist();

    } catch (error) {
      console.error(error);

      // 🔥 revert if failed
      setGetplaylist(prev =>
        prev.map(p =>
          p.id === playlistId
            ? { ...p, hasSongExist: false }
            : p
        )
      );
    }
  };
  console.log('add to playlist', getplaylist);


  const handleRemoveSong = async (playlistId) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      await axios.delete(
        `${API_URL}/api/users/${user.uid}/playlists/${playlistId}/song/${addtoplaylist.id}`,
        {
          data: {
            userId: user.uid,
            songId: addtoplaylist.id,
          },
        }
      );

      // 🔥 Optimistic untick
      setGetplaylist(prev =>
        prev.map(p =>
          p.id === playlistId
            ? { ...p, hasSongExist: false }
            : p
        )
      );
      await getlist();
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };


  const filteredPlaylists = getplaylist.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );
  useEffect(() => {
    const timeout = setTimeout(() => {
      // trigger filtering logic here
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchText]);


  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet }}>
      {children}
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
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{
          backgroundColor: '#121212',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: 'grey',
          width: 45,
          height: 5,
          borderRadius: 2,
        }}

      >
        <TouchableOpacity
          onPress={() => bottomSheetRef.current?.close()}
          style={styles.backIconContainer}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add to playlist</Text>
        </View>
        {/* SEARCH */}
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

        {/* PLAYLIST LIST */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: "#fff", textAlign: "center", }}>
              Loading...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPlaylists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 90 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.playlistItem} activeOpacity={0.7} onPress={() => {
                if (item.hasSongExist) {
                  handleRemoveSong(item.id);
                } else {
                  handleAddtoplaylist(item.id);
                }
              }}>
                {/* <View style={styles.playlistCover} /> */}
                <View style={styles.playlistCover}>
                  {item?.artworks?.length > 0 ? (
                    (() => {
                      const images =
                        item.artworks.length >= 4
                          ? item.artworks.slice(0, 4)   // 4+ → show 4
                          : item.artworks.slice(0, 2);  // <4 → show only 2

                      return images.map((uri, index) => (
                        <Image
                          key={index}
                          source={{ uri }}
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
                      source={require('../assets/musicphoto.jpg')}
                      style={styles.singleImage}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playlistName}>{item?.name}</Text>
                  <Text style={styles.playlistMeta}>{item?.totalSongs}</Text>
                </View>
                {item.hasSongExist ? (
                  <AntDesign name="checkcircle" color="#1DB954" size={24} />
                ) : (

                  <Feather name="plus-circle" color="#fff" size={24} />
                )}
              </TouchableOpacity>
            )}
          />
        )}
        {/* FLOATING BUTTON */}
        <TouchableOpacity
          style={styles.newPlaylistButton}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#000" />
          <Text style={styles.newPlaylistText}>New playlist</Text>
        </TouchableOpacity>
      </BottomSheet>
    </BottomSheetContext.Provider>
  );
}

export const useBottomSheet = () => useContext(BottomSheetContext);


const styles = StyleSheet.create({
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
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
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
  },

  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },

  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#1e1e1e',
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
    fontSize: 16,
    fontWeight: '600',
  },

  playlistMeta: {
    color: '#b3b3b3',
    fontSize: 13,
    marginTop: 3,
  },

  newPlaylistButton: {
    position: 'absolute',
    bottom: 100,
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
    fontWeight: '600',
    color: '#000',
  },
});

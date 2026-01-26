import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from './Navbar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';

const Search = () => {
  const navigation = useNavigation();
  const { globalSearch, setDataSearch, setSongsuggest } = useContext(SearchContext);
  const [allData, setAllData] = useState([]);
  const songsData = globalSearch?.songs?.data;
  const playlistsData = globalSearch?.playlists?.data;

  useEffect(() => {
    if (!songsData && !playlistsData) return;

    const mergedResults = [
      ...(songsData?.topQuery?.results || []),
      ...(songsData?.songs?.results || []),
      ...(songsData?.albums?.results || []),
      ...(songsData?.artists?.results || []),
      ...(playlistsData?.results || []),
    ];

    // remove duplicates
    const uniqueData = Array.from(
      new Map(
        mergedResults.map(item => [`${item.type}-${item.id}`, item])
      ).values()
    );

    setAllData(uniqueData);
    setSongsuggest(uniqueData);
  }, [songsData, playlistsData]);

  const renderItem = ({ item }) => {
    const screenName = {
      album: 'Album',
      song: 'Song',
      artist: 'Tartist',
      playlist: 'Playlist',
    }[item.type] || 'Song';


    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(screenName);
          setDataSearch(item.id);
        }}
      >
        <View style={styles.songContainer}>
          <Image
            source={
              item?.image?.[2]?.url
                ? { uri: item.image[2].url }
                : require('../assets/musicphoto.jpg')
            }
            style={styles.songImage}
          />
          <View style={styles.textContainer}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {(item?.title || item?.name)?.replace(/\s*\(.*?\)\s*/g, '')}
            </Text>

            {item?.year && (
              <Text style={styles.metaText}>({item.year})</Text>
            )}

            {item?.album && (
              <Text style={styles.metaText} numberOfLines={1}>
                {item.album.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            )}

            {item?.singers && (
              <Text style={styles.metaText} numberOfLines={2}>
                {item.singers.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0c0c0c', paddingBottom: 30, }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons
          name="arrow-back"
          size={30}
          color="white"
          style={{ marginLeft: 10, marginTop: 10 }}
        />
      </TouchableOpacity>

      <Navbar />

      <FlatList
        data={allData}
        keyExtractor={item => `${item.type}-${item.id}`}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

export default Search;

const styles = StyleSheet.create({
  songContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  metaText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
});

import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navbar from './Navbar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';


const Search = () => {
  const [type, setType] = useState('');
  const [allData, setAllData] = useState('');
  const navigation = useNavigation();
  const { globalSearch, setDataSearch, setSongsuggest } = useContext(SearchContext);
  const ablums = globalSearch?.songs?.data;
  const playlists = globalSearch?.playlists?.data;
  const searchData = globalSearch?.songs?.data?.topQuery?.results?.length > 0 ? globalSearch?.songs?.data?.topQuery.results : globalSearch?.songs?.data?.playlists?.results;
  console.log('searchData', searchData);
  console.log('i dont know', ablums);
  console.log("playlists", playlists);




  useEffect(() => {
    if (searchData?.length > 0) {
      const resultType = searchData[0]?.type;
      setType(resultType);
    }
  }, [searchData]);

  useEffect(() => {
    if (type && ablums) {
      let searchAb = [];
      if (type === 'album') {
        searchAb = ablums?.albums?.results;
      }
      else if (type === 'song') {
        searchAb = ablums?.songs?.results;
      }
      else if (type === 'artist') {
        searchAb = ablums?.topQuery?.results;
      }
      else if (type === 'playlist') {
        searchAb = playlists?.results; // ✅ correct playlist key
      }
      const playlistResults = playlists?.results || [];
      searchAb = [...searchAb, ...playlistResults];

      // Remove duplicates based on type + id
      const uniqueData = Array.from(
        new Map(searchAb.map(item => [`${item.type}-${item.id}`, item])).values()
      );

      console.log("TYPE:", type, "SEARCH RESULTS:", uniqueData);

      setSongsuggest(uniqueData);
      setAllData(uniqueData);
      console.log('searchab', searchAb);
    }
  }, [type, ablums]);



  return (
    <SafeAreaView className="flex-1  bg-stone-950 ">
      <TouchableOpacity onPress={() => navigation.goBack()} className='w-10 mt-10'>
        <Ionicons name="arrow-back" size={30} color="white" style={{ marginLeft: 10 }} />
      </TouchableOpacity>
      <Navbar />
      <FlatList
        data={allData}
        keyExtractor={(item) => `${item.type}-${item.id}`} // <- unique key
        renderItem={({ item }) => {
          // Use the item's own type
          const screenName = (() => {
            switch (item.type) {
              case 'album': return 'Album';
              case 'song': return 'Song';
              case 'artist': return 'Artist';
              case 'playlist': return 'Playlist';
              default: return 'Song';
            }
          })();
          return (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate(screenName);
                setDataSearch(item.id);
              }
              }
            >
              <View style={styles.songContainer}>
                {/* Image on the left */}
                <Image source={{ uri: item?.image[2]?.url }} style={styles.songImage} />
                {/* Text on the right */}
                <View style={[styles.textContainer, !item?.album && !item?.singers && styles.centerText]}>
                  <Text style={styles.songTitle} numberOfLines={2}>
                    {(item?.title || item?.name)?.replace(/\s*\(.*?\)\s*/g, '')}
                  </Text>
                  {item?.year && <Text style={styles.year} numberOfLines={1}>({item?.year})</Text>}
                  {item?.album && <Text style={styles.album} numberOfLines={1}>{item?.album.replace(/\s*\(.*?\)\s*/g, '')}</Text>}
                  {item?.singers && <Text style={styles.artist} numberOfLines={2}>{item?.singers.replace(/\s*\(.*?\)\s*/g, '')}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default Search;
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  songContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
    marginTop: 5,
  },
  year: {
    fontSize: 14,
    color: 'gray',  // Same as album & artist
    marginTop: 2,
  },
  centerText: {
    justifyContent: 'center', // Center text vertically when album & artist are missing
    height: 60,  // Match image height
  },
  songTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  album: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
  artist: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
});

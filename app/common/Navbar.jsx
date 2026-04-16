import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Navbar = () => {
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const navigation = useNavigation();
  const { setGlobalSearch } = useContext(SearchContext);

  // Actual search function
  const fetchSearch = async (query) => {
    if (!query.trim()) return;

    try {
      const [songRes, playlistRes] = await Promise.all([
        axios.get(`https://musify-api-inky.vercel.app/api/search?query=${encodeURIComponent(query)}`),
        axios.get(`https://musify-api-inky.vercel.app/api/search/playlists?query=${encodeURIComponent(query)}&limit=10`),
      ]);

      const songs = songRes.data || [];
      const playlists = playlistRes.data || [];

      setSearchResult({ songs, playlists });
      console.log('Search results:', { songs, playlists });
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };


  // Push results to global context and navigate
  useEffect(() => {
    if (searchResult) {
      setGlobalSearch(searchResult);
      navigation.navigate('Search', { query: search });
    }
  }, [searchResult]);



  return (
    <View style={styles.wrapper}>
      {/* 🔎 Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Search songs, albums, artists..."
          placeholderTextColor="gray"
          value={search}
          autoCorrect={true}
          autoComplete="off"
          onChangeText={(text) => {
            setSearch(text);
          }}
          onSubmitEditing={() => fetchSearch(search)}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={25} color="gray" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',   // flat bar style
    marginHorizontal: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '90%',
  },
  input: {
    fontFamily: 'Poppins-Medium',
    flex: 1,
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
});

import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SearchContext } from '../contextProvider/searchContext';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash.debounce';


const Navbar = () => {
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const navigation = useNavigation();
  const { setGlobalSearch } = useContext(SearchContext);

  // Debounced search function
  const fetchSearch = async (query) => {
    if (!query.trim()) return;

    try {
      // Call both endpoints simultaneously
      const [songRes, playlistRes] = await Promise.all([
        axios.get(`https://musify-api-inky.vercel.app/api/search?query=${encodeURIComponent(query)}`),
        axios.get(`https://musify-api-inky.vercel.app/api/search/playlists?query=${encodeURIComponent(query)}&limit=10`),
      ]);

      const songs = songRes.data || [];
      const playlists = playlistRes.data || [];

      // Combine results
      const combinedResults = {
        songs,
        playlists,
      };

      setSearchResult(combinedResults);
      console.log('Search results:', combinedResults);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  // Wrap with debounce
  const debouncedSearch = useCallback(
    debounce((text) => {
      fetchSearch(text);
    }, 1500),
    []
  );

  // Trigger search when user types
  const handleSearchChange = (text) => {
    setSearch(text);
    debouncedSearch(text);
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
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What you want to play?"
          returnKeyType="search"
          placeholderTextColor="gray"
          value={search}
          onChangeText={handleSearchChange}
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.clearIcon} onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={22} color="gray" />
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
  inputContainer: {
    width: '80%',
    position: 'relative',
  },
  input: {
    backgroundColor: '#1f1f1f',
    color: 'white',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#444',
    paddingRight: 40, // leave space for the icon
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
});
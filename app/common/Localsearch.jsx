import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash.debounce';

const Localsearch = ({ audioFiles, setFilteredFiles }) => {
  const [search, setSearch] = useState('');

  // debounce filter function (for typing)
  const debouncedFilter = useMemo(
    () =>
      debounce((text) => {
        const filtered = audioFiles.filter(
          (song) =>
            song.title.toLowerCase().includes(text.toLowerCase()) ||
            song.artist.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredFiles(filtered);
      }, 200),
    [audioFiles]
  );

  // handle search updates
  useEffect(() => {
    if (search === '') {
      // ✅ clear immediately without debounce
      setFilteredFiles(audioFiles);
      debouncedFilter.cancel(); // cancel any pending debounce
    } else {
      debouncedFilter(search);
    }

    return () => debouncedFilter.cancel();
  }, [search, audioFiles, debouncedFilter]);

  // instant clear function
  const handleClear = () => {
    setSearch('');
    // setFilteredFiles(audioFiles); // immediately show full list
    debouncedFilter.cancel();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Search songs, artists..."
          placeholderTextColor="gray"
          value={search}
          autoCorrect={true}
          autoComplete="off"
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.clearIcon} onPress={handleClear}>
            <Ionicons name="close-circle" size={22} color="gray" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Localsearch;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    marginHorizontal: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: '90%',
  },
  input: {
    flex: 1,
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
});

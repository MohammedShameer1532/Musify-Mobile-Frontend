import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Localsearch = ({ audioFiles, setFilteredFiles }) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (search === '') {
      setFilteredFiles(audioFiles);
    } else {
      const filtered = audioFiles.filter(song =>
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        song.artist.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [search, audioFiles]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by title or artist"
          placeholderTextColor="gray"
          value={search}
          onChangeText={setSearch}
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

export default Localsearch;

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
    paddingRight: 40,
  },
  clearIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -11 }],
  },
});

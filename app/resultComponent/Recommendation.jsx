import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchContext } from '../contextProvider/searchContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const Recommendation = () => {
  const [suggestion, setSuggestion] = useState([]);
  const navigation = useNavigation();
  const { setDataSearch, songsuggest } = useContext(SearchContext);

  const DEFAULT_ID = "Omwz5JtQ";
  const id = songsuggest[0]?.id || DEFAULT_ID;

  useFocusEffect(
    useCallback(() => {
      getSuggestions();
    }, [id])
  );
  const getSuggestions = async () => {
    try {
      const validId = /^\d+$/.test(id) ? DEFAULT_ID : id;

      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs/${validId}/suggestions?limit=30`
      );

      const data = res.data.data || [];
      setSuggestion(data);

      console.log('Fetched fresh data ✅', data);
    } catch (err) {
      console.log('Error:', err);
    }
  };

  const getHighResImage = (image) => {
    if (!image) return null;

    // ✅ Case 1: JioSaavn image array
    if (Array.isArray(image)) {
      return (
        image.find(img => img.quality === '500x500')?.link ||
        image.find(img => img.quality === '150x150')?.link ||
        image[image.length - 1]?.link
      );
    }

    // ✅ Case 2: String image (Playlists, Artist)
    if (typeof image === 'string') {
      return image
        .replace(/_\d+x\d+/, '_500x500')
        .replace(/-\d+x\d+/, '-500x500');
    }

    return null;
  };

  return (
    <View >
      <Text style={styles.header} >Recommendation</Text>
      <FlatList
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0, marginLeft: 20, padding: 5 }}
        horizontal
        data={suggestion}
        keyExtractor={(song) => song.id}
        renderItem={({ item: song }) => (
          <View style={styles.songContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Sresult', setDataSearch(song.id))}
            >
              <Image
                source={{ uri: getHighResImage(song?.image[2]?.url) }}
                className="rounded-3xl w-44 h-48 p-4"
                resizeMode="cover"
              />
              <Text
                style={styles.songTitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {song?.name?.replace(/\s*\(.*?\)\s*/g, '')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default Recommendation;
const styles = StyleSheet.create({
  header: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: 'white',
    marginLeft: 20,
    marginTop: 5,
  },

  songContainer: {
    marginTop: 0,
    marginRight: 16,   // ✅ controls gap between images
    alignItems: 'flex-start',
  },

  songTitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 10,
    width: 176,       // match image width
    fontFamily: 'Poppins-Regular',
  }
})
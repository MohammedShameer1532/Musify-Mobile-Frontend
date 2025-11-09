import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchContext } from '../contextProvider/searchContext';
import { useNavigation } from '@react-navigation/native';

const Suggestion = () => {
  const [suggestion, setSuggestion] = useState([]);
  const navigation = useNavigation();
  const { setDataSearch, songsuggest } = useContext(SearchContext);

  const DEFAULT_ID = "Ecy1FJ5s";
  const id = songsuggest[0]?.id || DEFAULT_ID;

  useEffect(() => {
    getSuggestions();
  }, [id]);

  const getSuggestions = async () => {
    try {
      // If ID is a number, use default
      const validId = /^\d+$/.test(id) ? DEFAULT_ID : id;

      // Check cache
      const cache = await AsyncStorage.getItem(`suggestion_${validId}`);
      if (cache) {
        const { data, time } = JSON.parse(cache);
        const isFresh = Date.now() - time < 24 * 60 * 60 * 1000; // 1 day
        if (isFresh) {
          setSuggestion(data);
          console.log('Loaded from cache ✅', data);
          return;
        }
      }

      // Fetch from API
      const res = await axios.get(
        `https://jiosavan-api2.vercel.app/api/songs/${validId}/suggestions?limit=20`
      );
      const data = res.data?.data || [];
      setSuggestion(data);

      // Save to cache
      await AsyncStorage.setItem(
        `suggestion_${validId}`,
        JSON.stringify({ data, time: Date.now() })
      );

      console.log('Fetched new data ✅', res);
    } catch (err) {
      console.log('Error:', err);
    }
  };

  return (
    <View>
      <Text className="text-2xl font-bold text-white ml-5 mt-5">For you</Text>
      <FlatList
        contentContainerStyle={{ paddingBottom: 20, marginLeft: 20, padding: 5 }}
        horizontal
        data={suggestion}
        keyExtractor={(song) => song.id}
        renderItem={({ item: song }) => (
          <View style={styles.songContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Sresult', setDataSearch(song.id))}
            >
              <Image
                source={{ uri: song?.image[2]?.url }}
                className="rounded-xl w-48 h-48 p-4"
                resizeMode="cover"
              />
              <Text style={{ color: 'white', fontSize: 14, width: 192, marginTop: 8 }}
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

export default Suggestion;

const styles = StyleSheet.create({
  songContainer: {
    marginRight: 15,
    alignItems: 'center',
    marginTop: 30,
  },
});

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
        `https://www.jiosaavn.com/api.php?__call=reco.getreco&api_version=4&_format=json&_marker=0&ctx=wap6dot0&pid=${validId}&language=tamil`
      );

      const data = res.data || [];
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
    <View>
      <Text className="text-2xl font-bold text-white ml-5 mt-5">Recommendation</Text>
      <FlatList
        showsHorizontalScrollIndicator={false}
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
                source={{ uri: getHighResImage(song?.image) }}
                className="rounded-xl w-48 h-48 p-4"
                resizeMode="cover"
              />
              <Text style={{ color: 'white', fontSize: 14, width: 192, marginTop: 8 }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {song?.title?.replace(/\s*\(.*?\)\s*/g, '')}
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
  songContainer: {
    marginRight: 15,
    alignItems: 'center',
    marginTop: 30,
  },
});

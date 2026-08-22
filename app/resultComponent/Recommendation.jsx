import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useContext, useState } from 'react';
import axios from 'axios';
import { SearchContext } from '../contextProvider/searchContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window'); // screen width

const Recommendation = () => {
  const [suggestion, setSuggestion] = useState([]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const { setDataSearch, songsuggest } = useContext(SearchContext);

  const DEFAULT_ID = "_giyfEgV";
  const id = songsuggest[0]?.id || DEFAULT_ID;

  useFocusEffect(
    useCallback(() => {
      getSuggestions();
    }, [id])
  );

  const getSuggestions = async () => {
    try {
      setLoading(true);
      const validId = /^\d+$/.test(id) ? DEFAULT_ID : id;
      const res = await axios.get(
        `https://musify-api-inky.vercel.app/api/songs/${validId}/suggestions?limit=30`
      );
      setSuggestion(res.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHighResImage = (image) => {
    if (!image) return null;
    if (Array.isArray(image)) {
      return (
        image.find(img => img.url?.includes('500x500'))?.url ||
        image.find(img => img.url?.includes('150x150'))?.url ||
        image[0]?.url
      );
    }
    if (typeof image === 'string') {
      return image.replace(/_\d+x\d+/, '_500x500').replace(/-\d+x\d+/, '-500x500');
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header} className='font-extrabold'>You Might Like</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color="#10b981"
          />
          <Text style={styles.loadingText}>
            Loading...
          </Text>
        </View>
      ) : (
        <FlatList
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.artistList}
          horizontal
          data={suggestion}
          keyExtractor={(song) => song.id}
          renderItem={({ item: song }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => navigation.navigate('Sresult', setDataSearch(song.id))}>
                <Image
                  source={{ uri: getHighResImage(song?.image) }}
                  style={styles.artistImage}
                  resizeMode="cover"
                />
                <Text style={styles.artistName} numberOfLines={2} ellipsizeMode="tail">
                  {song?.name?.replace(/\s*\(.*?\)\s*/g, '')}
                </Text>
                <Text style={styles.artistSubtitle} numberOfLines={1}>
                  {song?.type
                    ? song.type.charAt(0).toUpperCase() + song.type.slice(1)
                    : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default Recommendation;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 5,
  },
  header: {
    color: 'white',
    fontSize: 16,
    marginLeft: 20,
    marginTop: 5,
    marginBottom: 10,
  },

  loadingContainer: {
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#9ca3af',
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  artistList: {
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  card: {
    width: width * 0.45,
  },
  artistImage: {
    width: '90%',
    height: 160,
    borderRadius: 20,
  },
  artistName: {
    color: 'white',
    fontSize: 12,
    marginTop: 10,
    width: '100%',
    fontFamily: 'Poppins-Medium',
  },
  artistSubtitle: {
    color: '#9ca3af',
    fontSize: 10.5,
    marginTop: 3,
    fontFamily: 'Poppins-Regular',
  },
});

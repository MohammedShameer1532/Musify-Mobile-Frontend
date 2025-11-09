import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const Setting = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView className="flex-1  bg-stone-950">
      <TouchableOpacity onPress={() => navigation.goBack()} className='w-10'>
        <Ionicons name="arrow-back" size={30} color="white" style={{ marginLeft: 10 }} />
      </TouchableOpacity>
      <View>
        <Text className="text-white">settings</Text>
      </View>
    </SafeAreaView>
  );
};

export default Setting;

const styles = StyleSheet.create({});

import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { SafeAreaView } from 'react-native-safe-area-context';

import Scanner from './Scanner';


const Qrscanner = ({ navigation }) => {

  return (

    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >

      <View style={styles.scannerContainer}>

        {/* CAMERA SCANNER */}

        <Scanner />


        {/* BACK BUTTON */}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >

          <Ionicons
            name="arrow-back"
            size={23}
            color="#fff"
          />

          <Text style={styles.backText}>
            Back
          </Text>

        </TouchableOpacity>

      </View>

    </SafeAreaView>

  );

};


export default Qrscanner;


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#000',
  },


  scannerContainer: {
    flex: 1,
  },


  backButton: {
    position: 'absolute',

    top: 15,

    left: 18,

    height: 42,

    paddingHorizontal: 16,

    borderRadius: 22,

    backgroundColor: 'rgba(0,0,0,0.55)',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.18)',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    zIndex: 100,
  },


  backText: {
    color: '#fff',

    fontFamily: 'Poppins-Bold',

    fontSize: 14,

    marginLeft: 7,
  },

});
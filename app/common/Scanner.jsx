import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';

import { RNHoleView } from 'react-native-hole-view';

import {
  launchImageLibrary,
} from 'react-native-image-picker';

import QRKit from 'react-native-qr-kit';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { useNavigation } from '@react-navigation/native';

import { SearchContext } from '../contextProvider/searchContext';


const { width, height } = Dimensions.get('window');

const BASE_WIDTH = 360;

const scale = size => (width / BASE_WIDTH) * size;


const Scanner = () => {

  const device = useCameraDevice('back');

  const navigation = useNavigation();

  const { setScaneddata } = useContext(SearchContext);

  const [hasPermission, setHasPermission] = useState(false);

  const [scanningImage, setScanningImage] = useState(false);

  const scanned = useRef(false);


  // --------------------------------------------------
  // SCAN FRAME
  // --------------------------------------------------

  const frameSize = Math.min(width * 0.78, 320);

  const frameX = (width - frameSize) / 2;

  const frameY = Math.max(
    145,
    height * 0.20
  );


  // --------------------------------------------------
  // CAMERA PERMISSION
  // --------------------------------------------------

  useEffect(() => {

    const requestPermission = async () => {

      try {

        const permission =
          await Camera.requestCameraPermission();

        setHasPermission(permission === 'granted');

      } catch (error) {

        console.error(
          'Camera permission error:',
          error
        );

      }

    };

    requestPermission();

  }, []);


  // --------------------------------------------------
  // NAVIGATE WITH QR RESULT
  // --------------------------------------------------

  const handleQRCode = value => {

    if (!value || !value.trim()) {
      return;
    }

    setScaneddata(value.trim());

    navigation.navigate('Scansheet');

  };


  // --------------------------------------------------
  // LIVE CAMERA QR SCANNER
  // --------------------------------------------------

  const codeScanner = useCodeScanner({

    codeTypes: ['qr'],

    onCodeScanned: codes => {

      if (
        !codes ||
        codes.length === 0 ||
        scanned.current
      ) {
        return;
      }

      const value = codes[0]?.value;

      if (!value) {
        return;
      }

      scanned.current = true;

      handleQRCode(value);

      // Prevent multiple scans
      setTimeout(() => {

        scanned.current = false;

      }, 2000);

    },

  });


  // --------------------------------------------------
  // PICK QR IMAGE FROM GALLERY
  // --------------------------------------------------

  const pickQRCodeFromGallery = async () => {

    if (scanningImage) {
      return;
    }

    try {

      setScanningImage(true);

      const result = await launchImageLibrary({

        mediaType: 'photo',

        selectionLimit: 1,

        quality: 1,

      });


      // User cancelled
      if (result.didCancel) {

        setScanningImage(false);

        return;

      }


      // Picker error
      if (result.errorCode) {

        console.error(
          'Image picker error:',
          result.errorCode,
          result.errorMessage
        );

        Alert.alert(
          'Unable to select image',
          result.errorMessage ||
          'Something went wrong while selecting the image.'
        );

        setScanningImage(false);

        return;

      }


      const asset = result.assets?.[0];

      if (!asset?.uri) {

        Alert.alert(
          'No image selected',
          'Please select an image containing a QR code.'
        );

        setScanningImage(false);

        return;

      }


      let imagePath = asset.uri;


      // ------------------------------------------------
      // QRKit expects a local image path.
      // Android image-picker normally returns a usable
      // content:// URI, but file:// can also occur.
      // ------------------------------------------------

      if (imagePath.startsWith('file://')) {

        imagePath = imagePath.replace(
          'file://',
          ''
        );

      }


      console.log(
        'Scanning QR image:',
        imagePath
      );


      // ------------------------------------------------
      // DECODE QR FROM IMAGE
      // ------------------------------------------------

      const qrResult =
        await QRKit.decodeQR(imagePath);


      console.log(
        'QR result:',
        qrResult
      );


      if (
        qrResult?.success &&
        qrResult?.data
      ) {

        handleQRCode(qrResult.data);

      } else {

        Alert.alert(
          'No QR code found',
          'We could not find a QR code in this image. Please choose a clearer QR image.'
        );

      }

    } catch (error) {

      console.error(
        'Gallery QR scan error:',
        error
      );

      Alert.alert(
        'QR scan failed',
        'Unable to scan this image. Please try another image.'
      );

    } finally {

      setScanningImage(false);

    }

  };


  // --------------------------------------------------
  // CAMERA PERMISSION UI
  // --------------------------------------------------

  if (!hasPermission) {

    return (

      <View style={styles.center}>

        <Ionicons
          name="camera-outline"
          size={55}
          color="#1DB954"
        />

        <Text style={styles.permissionTitle}>
          Camera permission required
        </Text>

        <Text style={styles.permissionText}>
          Allow camera access to scan QR codes
        </Text>

      </View>

    );

  }


  // --------------------------------------------------
  // CAMERA LOADING
  // --------------------------------------------------

  if (!device) {

    return (

      <View style={styles.center}>

        <ActivityIndicator
          size="large"
          color="#1DB954"
        />

        <Text style={styles.permissionText}>
          Loading camera...
        </Text>

      </View>

    );

  }


  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (

    <View style={styles.container}>

      {/* CAMERA */}

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scanningImage}
        codeScanner={codeScanner}
      />


      {/* DARK OVERLAY WITH HOLE */}

      <RNHoleView
        pointerEvents="none"
        style={styles.overlay}
        holes={[
          {
            x: frameX,
            y: frameY,
            width: frameSize,
            height: frameSize,
            borderRadius: 18,
          },
        ]}
      />


      {/* TOP TITLE */}

      <View style={styles.topTitleContainer}>

        <Text style={styles.title}>
          Scan QR Code
        </Text>

        <Text style={styles.subtitle}>
          Scan a QR code using your camera
        </Text>

      </View>


      {/* QR CORNER FRAME */}

      <View
        style={[
          styles.scanFrame,
          {
            width: frameSize,
            height: frameSize,
            top: frameY,
            left: frameX,
          },
        ]}
      >

        <View
          style={[
            styles.corner,
            styles.topLeft,
          ]}
        />

        <View
          style={[
            styles.corner,
            styles.topRight,
          ]}
        />

        <View
          style={[
            styles.corner,
            styles.bottomLeft,
          ]}
        />

        <View
          style={[
            styles.corner,
            styles.bottomRight,
          ]}
        />

      </View>


      {/* SCAN INSTRUCTION */}

      <Text
        style={[
          styles.scanText,
          {
            top: frameY + frameSize + 20,
          },
        ]}
      >
        Align the QR code inside the frame
      </Text>


      {/* GALLERY BUTTON */}

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.galleryButton}
        onPress={pickQRCodeFromGallery}
        disabled={scanningImage}
      >

        {scanningImage ? (

          <ActivityIndicator
            size="small"
            color="#fff"
          />

        ) : (

          <Ionicons
            name="images-outline"
            size={23}
            color="#fff"
          />

        )}

        <Text style={styles.galleryButtonText}>

          {scanningImage
            ? 'Scanning QR...'
            : 'Pick QR from Gallery'}

        </Text>

      </TouchableOpacity>


      {/* SMALL HELP TEXT */}

      <Text style={styles.bottomHint}>
        You can also select a QR code image from your device
      </Text>

    </View>

  );

};


export default Scanner;


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#000',
  },


  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.60)',
  },


  topTitleContainer: {
    position: 'absolute',
    top: 55,
    left: 20,
    right: 20,
    alignItems: 'center',
  },


  title: {
    color: '#fff',
    fontSize: scale(24),
    fontFamily: 'Poppins-Bold',
  },


  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: scale(12),
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },


  scanFrame: {
    position: 'absolute',
  },


  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#fff',
  },


  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },


  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },


  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },


  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },


  scanText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#fff',
    fontSize: scale(13),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
  },


  galleryButton: {
    position: 'absolute',

    bottom: 105,

    alignSelf: 'center',

    minWidth: 235,

    height: 52,

    paddingHorizontal: 24,

    borderRadius: 28,

    backgroundColor: '#1DB954',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 8,

    shadowColor: '#000',

    shadowOpacity: 0.3,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 4,
    },
  },


  galleryButtonText: {
    color: '#fff',
    fontSize: scale(14),
    fontFamily: 'Poppins-Bold',
    marginLeft: 10,
  },


  bottomHint: {
    position: 'absolute',

    bottom: 72,

    left: 25,

    right: 25,

    textAlign: 'center',

    color: 'rgba(255,255,255,0.55)',

    fontSize: scale(10),

    fontFamily: 'Poppins-Regular',
  },


  center: {
    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: '#0f0f0f',

    paddingHorizontal: 30,
  },


  permissionTitle: {
    color: '#fff',
    fontSize: scale(18),
    fontFamily: 'Poppins-Bold',
    marginTop: 15,
    textAlign: 'center',
  },


  permissionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: scale(13),
    fontFamily: 'Poppins-Regular',
    marginTop: 8,
    textAlign: 'center',
  },

});
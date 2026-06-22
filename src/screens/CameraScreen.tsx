import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { AnimalCard, AnimalKind } from '../types';
import { generateAnimalCard } from '../services/cardGenerator';

type Props = {
  onCardCreated: (card: AnimalCard) => void;
};

export function CameraScreen({ onCardCreated }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [kind, setKind] = useState<AnimalKind>('cat');
  const [isBusy, setBusy] = useState(false);

  async function capture() {
    if (!cameraRef.current || isBusy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.82 });
      if (photo?.uri) onCardCreated(generateAnimalCard(photo.uri, kind));
    } finally {
      setBusy(false);
    }
  }

  async function pickImage() {
    if (isBusy) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9
      });
      if (!result.canceled && result.assets[0]?.uri) {
        onCardCreated(generateAnimalCard(result.assets[0].uri, kind));
      }
    } finally {
      setBusy(false);
    }
  }

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionPanel}>
        <Text style={styles.permissionTitle}>Kamera izni gerekli</Text>
        <Text style={styles.permissionText}>Kedi ve köpekleri kartlaştırmak için kamerayı açmamız gerekiyor.</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.targetBox}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      <View style={styles.controls}>
        <View style={styles.segmented}>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.segment, kind === 'cat' && styles.activeSegment]}
            onPress={() => setKind('cat')}
          >
            <Text style={[styles.segmentText, kind === 'cat' && styles.activeSegmentText]}>Kedi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.segment, kind === 'dog' && styles.activeSegment]}
            onPress={() => setKind('dog')}
          >
            <Text style={[styles.segmentText, kind === 'dog' && styles.activeSegmentText]}>Köpek</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.secondaryText}>Galeri</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.captureButton} onPress={capture}>
            {isBusy ? <ActivityIndicator color="#17130a" /> : <Text style={styles.captureText}>Tara</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  camera: {
    flex: 1
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  permissionPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14
  },
  permissionTitle: {
    color: '#fff8ea',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center'
  },
  permissionText: {
    color: '#b8c1d0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  targetBox: {
    position: 'absolute',
    top: '24%',
    left: '11%',
    right: '11%',
    height: '38%'
  },
  cornerTopLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 48,
    height: 48,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#f0b84f'
  },
  cornerTopRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 48,
    height: 48,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#f0b84f'
  },
  cornerBottomLeft: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 48,
    height: 48,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#f0b84f'
  },
  cornerBottomRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 48,
    height: 48,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#f0b84f'
  },
  controls: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    gap: 12
  },
  segmented: {
    height: 46,
    padding: 4,
    borderRadius: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(14,17,22,0.86)'
  },
  segment: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeSegment: {
    backgroundColor: '#f0b84f'
  },
  segmentText: {
    color: '#eef3fb',
    fontWeight: '900'
  },
  activeSegmentText: {
    color: '#15120c'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  secondaryButton: {
    width: 112,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19,23,31,0.94)'
  },
  secondaryText: {
    color: '#f5f7fb',
    fontSize: 16,
    fontWeight: '900'
  },
  captureButton: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0b84f'
  },
  captureText: {
    color: '#15120c',
    fontSize: 18,
    fontWeight: '900'
  },
  primaryButton: {
    marginTop: 8,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0b84f'
  },
  primaryText: {
    color: '#15120c',
    fontWeight: '900'
  }
});

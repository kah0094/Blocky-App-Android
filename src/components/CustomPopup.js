import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CustomPopup({ visible, title, message, onClose, onConfirm, type = 'info' }) {
  const isError = type === 'error';
  const color = isError ? '#ff4444' : '#00ff9d';
  const icon = isError ? 'alert-circle' : 'checkmark-circle';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, { borderLeftColor: color }]}>
          
          <View style={styles.header}>
             <Ionicons name={icon} size={24} color={color} />
             <Text style={[styles.title, { color }]}>{title}</Text>
          </View>
          
          <Text style={styles.msg}>{message}</Text>
          
          <View style={styles.footer}>
             {onConfirm && (
                 <TouchableOpacity onPress={onClose} style={{marginRight:20}}>
                     <Text style={{color:'#666', fontWeight:'bold'}}>Cancelar</Text>
                 </TouchableOpacity>
             )}
             <TouchableOpacity 
                style={[styles.btn, { backgroundColor: color }]} 
                onPress={onConfirm || onClose}
             >
                <Text style={styles.btnText}>{onConfirm ? 'Confirmar' : 'OK'}</Text>
             </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  box: { 
      width: width * 0.8, backgroundColor: '#18181b', padding: 25, borderRadius: 12,
      borderLeftWidth: 4, borderWidth: 1, borderColor: '#333'
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  msg: { color: '#ccc', fontSize: 16, lineHeight: 22, marginBottom: 20 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  btn: { paddingVertical: 8, paddingHorizontal: 25, borderRadius: 8 },
  btnText: { color: '#000', fontWeight: 'bold' }
});

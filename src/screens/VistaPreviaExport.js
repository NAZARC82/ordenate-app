import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { exportarPDFSeleccion } from '../utils/pdfExport';
import ActionSheet from '../components/ActionSheet';

const VistaPreviaExport = ({ route, navigation }) => {
  const { htmlContent, movimientos, opciones } = route.params;
  const [loading, setLoading] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const isMountedRef = useRef(true);
  const htmlContentRef = useRef(htmlContent);
  
  // Cleanup al unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Limpiar referencias grandes
      htmlContentRef.current = '';
      setExportResult(null);
    };
  }, []);

  // Manejar exportación PDF desde la vista previa
  const handleExportarPDF = async () => {
    // Prevenir múltiples exportaciones o si el componente se desmontó
    if (loading || !isMountedRef.current) return;
    
    try {
      setLoading(true);
      
      // Verificar que aún tenemos datos válidos
      if (!movimientos || movimientos.length === 0) {
        Alert.alert('Error', 'No hay datos para exportar.');
        return;
      }
      
      const result = await exportarPDFSeleccion(movimientos, opciones);
      
      // Verificar si el componente sigue montado antes de actualizar estado
      if (!isMountedRef.current) return;
      
      if (result && result.success) {
        setExportResult(result);
        setActionSheetVisible(true);
      } else {
        Alert.alert('Error', 'No se pudo exportar el archivo PDF.');
      }
      
    } catch (error) {
      // Cancelación silenciosa si el componente se desmontó
      if (!isMountedRef.current) return;
      
      console.error('Error al exportar PDF:', error);
      
      // Error más específico basado en el tipo de error
      const errorMsg = error.message?.includes('network') 
        ? 'Error de conectividad. Verifique su conexión e inténtelo de nuevo.'
        : error.message?.includes('permission')
        ? 'Permisos insuficientes para guardar el archivo.'
        : 'No se pudo exportar el archivo PDF. Por favor, inténtelo de nuevo.';
        
      Alert.alert('Error', errorMsg, [{ text: 'OK' }]);
    } finally {
      // Solo actualizar estado si el componente sigue montado
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Manejar cierre del ActionSheet
  const handleActionSheetClose = () => {
    if (isMountedRef.current) {
      setActionSheetVisible(false);
      setExportResult(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>Vista Previa</Text>
          <Text style={styles.subtitleText}>
            {movimientos?.length || 0} movimientos
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.exportButton, loading && styles.exportButtonDisabled]}
          onPress={handleExportarPDF}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="download" size={20} color="white" />
          )}
          <Text style={styles.exportButtonText}>
            {loading ? 'Exportando...' : 'Exportar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* WebView con vista previa */}
      <View style={styles.webViewContainer}>
        {webViewLoading && (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Cargando vista previa...</Text>
          </View>
        )}
        
        <WebView
          source={{ html: htmlContentRef.current }}
          originWhitelist={['*']}
          style={styles.webView}
          onLoadStart={() => setWebViewLoading(true)}
          onLoadEnd={() => setWebViewLoading(false)}
          onError={() => {
            setWebViewLoading(false);
            Alert.alert(
              'Error',
              'No se pudo cargar la vista previa del reporte.',
              [{ text: 'OK' }]
            );
          }}
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={true}
          scalesPageToFit={false}
          contentMode="mobile"
          startInLoadingState={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlaybook={true}
          bounces={false}
          automaticallyAdjustContentInsets={false}
          androidHardwareAccelerationDisabled={false}
          injectedJavaScript={`
            (function() {
              // Ensure content fits to screen width
              const viewport = document.querySelector('meta[name=viewport]');
              if (viewport) {
                viewport.content = 'width=device-width, initial-scale=0.85, maximum-scale=3.0, user-scalable=yes';
              }
              
              // Allow horizontal scroll for summary section only
              document.body.style.overflowX = 'auto';
              document.body.style.overflowY = 'auto';
              document.documentElement.style.overflowX = 'auto';
              document.documentElement.style.overflowY = 'auto';
              
              // Add touch-action for better zoom control
              document.body.style.touchAction = 'pan-x pan-y pinch-zoom';
            })();
            true;
          `}
          containerStyle={{ backgroundColor: '#f6f7f9' }}
        />
      </View>

      {/* Footer informativo */}
      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={16} color="#64748b" />
          <Text style={styles.infoText}>
            Esta es una vista previa de cómo se verá tu reporte exportado
          </Text>
        </View>
      </View>

      {/* ActionSheet para compartir */}
      <ActionSheet
        visible={actionSheetVisible}
        onClose={handleActionSheetClose}
        fileUri={exportResult?.fileUri}
        fileName={exportResult?.fileName}
        mimeType={exportResult?.mimeType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f6f7f9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  webView: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});

export default VistaPreviaExport;
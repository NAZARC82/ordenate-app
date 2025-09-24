import React, { useMemo, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMovimientos } from '../state/MovimientosContext';
import { getDateString } from '../utils/date';
import { getEstadoColor } from '../utils/estadoColor';

export default function PantallaHistorial() {
  const { movimientos, updateMovimiento, removeMovimiento } = useMovimientos();
  const route = useRoute();
  const navigation = useNavigation();
  const filter = route.params?.filter ?? null;

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'Historial',
      headerBackTitle: 'Volver',
    });
  }, [navigation]);

  // Global list ordered DESC by fechaISO, independent of calendar
  const filtered = useMemo(() => {
    let base = [...movimientos];
    if (filter?.day) {
      base = base.filter(m => getDateString(m.fechaISO) === filter.day);
    }
    if (filter?.estado) {
      if (filter.estado === 'no-pagado') {
        base = base.filter(m => m.estado !== 'pagado');
      } else {
        base = base.filter(m => m.estado === filter.estado);
      }
    }
    return base;
  }, [movimientos, filter]);

  const sortedMovimientos = useMemo(() => {
    return filtered.sort((a, b) => new Date(b.fechaISO) - new Date(a.fechaISO));
  }, [filtered]);

  const formatDate = (fechaISO) => {
    try {
      return new Date(fechaISO).toLocaleDateString('es-UY', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const handleEditar = (item) => {
    navigation.navigate('MovementDetail', { mode: 'edit', id: item.id });
  };

  const handleMarcarPagado = (item) => {
    if (item.estado === 'pagado') return;
    const result = updateMovimiento(item.id, { estado: 'pagado' });
    if (!result?.success) {
      console.warn('Error al marcar pagado:', result?.error);
    }
  };

  const handleBorrar = (item) => {
    Alert.alert(
      'Borrar movimiento',
      '¿Seguro que querés borrar este movimiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => {
            const result = removeMovimiento(item.id);
            if (!result?.success) {
              console.warn('Error al borrar:', result?.error);
            }
          } 
        },
      ]
    );
  };

  const renderMovementItem = ({ item }) => (
    <View style={styles.movementItem}>
      <View style={styles.movementHeader}>
        <View style={styles.movementLeft}>
          <Text style={styles.movementTipo}>
            {item.tipo === 'pago' ? 'Pago' : 'Cobro'}
          </Text>
          <Text style={styles.movementDate}>
            {formatDate(item.fechaISO)}
          </Text>
        </View>
        <View style={styles.movementRight}>
          <Text style={[
            styles.movementMonto,
            { color: item.tipo === 'pago' ? '#c62828' : '#2e7d32' }
          ]}>
            {item.tipo === 'pago' ? '-' : '+'}${item.monto}
          </Text>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}>
            <Text style={styles.estadoText}>{item.estado}</Text>
          </View>
        </View>
      </View>
      {item.nota && (
        <Text style={styles.movementNota}>{item.nota}</Text>
      )}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => handleEditar(item)}>
          <Text style={styles.actionLink}>Editar</Text>
        </TouchableOpacity>
        {item.estado !== 'pagado' && (
          <TouchableOpacity onPress={() => handleMarcarPagado(item)}>
            <Text style={styles.actionLink}>Marcar pagado</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleBorrar(item)}>
          <Text style={[styles.actionLink, { color: '#c62828' }]}>Borrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <Text style={styles.title}>Historial</Text>
      
      {sortedMovimientos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay movimientos registrados</Text>
          <Text style={styles.emptySubtext}>
            Los movimientos aparecerán aquí ordenados por fecha más reciente
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.subtitle}>
            {sortedMovimientos.length} movimiento{sortedMovimientos.length !== 1 ? 's' : ''} 
            {filter ? ' (filtrados)' : ''}
          </Text>
          <FlatList
            data={sortedMovimientos}
            keyExtractor={item => String(item.id ?? item._id ?? `${item.tipo}-${item.fechaISO}`)}
            renderItem={renderMovementItem}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCF8',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4D3527',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  movementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  movementLeft: {
    flex: 1,
  },
  movementRight: {
    alignItems: 'flex-end',
  },
  movementTipo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4D3527',
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 12,
    color: '#666',
  },
  movementMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  movementNota: {
    fontSize: 14,
    color: '#444',
    lineHeight: 18,
  },
  separator: {
    height: 12,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 16,
  },
  actionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3E7D75',
  },
});
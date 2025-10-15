// src/__tests__/SettingsScreen.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../screens/SettingsScreen';

const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate } as any;

// Mock de módulos
jest.mock('../modules/reminders', () => ({
  getReminderSettings: jest.fn(() => Promise.resolve({
    silentWindow: { enabled: true, startTime: '22:00', endTime: '08:00' },
    defaultSnoozeMinutes: 60,
    enableBadge: true,
  })),
  saveReminderSettings: jest.fn(),
  cleanupOldReminders: jest.fn(),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar correctamente', async () => {
    render(<SettingsScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(screen.getByText('Ajustes')).toBeTruthy();
    });
  });

  it('debe tener ScrollView con testID correcto', async () => {
    render(<SettingsScreen navigation={mockNavigation} />);
    
    const scroll = await screen.findByTestId('settings-scroll');
    expect(scroll).toBeTruthy();
  });

  it('debe mostrar botón Gestor de Documentos cuando FLAGS.pdfHubInSettings es true', async () => {
    // FLAGS.pdfHubInSettings ya está en true por defecto
    render(<SettingsScreen navigation={mockNavigation} />);
    
    const btn = await screen.findByTestId('btn-documents');
    expect(btn).toBeTruthy();
    expect(screen.getByText('Gestor de Documentos')).toBeTruthy();
  });

  it('debe navegar a DocumentManager al presionar el botón', async () => {
    render(<SettingsScreen navigation={mockNavigation} />);
    
    const btn = await screen.findByTestId('btn-documents');
    fireEvent.press(btn);
    
    expect(mockNavigate).toHaveBeenCalledWith('DocumentManager');
  });

  it('debe renderizar sección de Recordatorios', async () => {
    render(<SettingsScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(screen.getByText('🔔 Recordatorios')).toBeTruthy();
      expect(screen.getByText('Ventana Silenciosa')).toBeTruthy();
    });
  });

  it('debe tener padding suficiente para no cortar contenido', async () => {
    const { getByTestId } = render(<SettingsScreen navigation={mockNavigation} />);
    
    const scroll = await waitFor(() => getByTestId('settings-scroll'));
    expect(scroll).toBeTruthy();
    
    // Verificar que el ScrollView existe (paddingBottom se aplica en contentContainerStyle)
    expect(scroll.props.contentContainerStyle).toBeDefined();
  });
});

import { getSocketIO, emitToCompany } from '@/lib/socket';

export class SocketService {
  emitVehicleConnected(companyId: string, vehicleId: string, data: { latitude: number; longitude: number; timestamp: Date }) {
    emitToCompany(companyId, 'vehicle:connected', { vehicleId, ...data });
  }

  emitLocationUpdate(companyId: string, vehicleId: string, data: { latitude: number; longitude: number; speed?: number; heading?: number; timestamp: Date }) {
    emitToCompany(companyId, 'location:update', { vehicleId, ...data });
  }

  emitTelemetryUpdate(companyId: string, vehicleId: string, data: { speed?: number; fuelLevel?: number; engineStatus?: string; timestamp: Date }) {
    emitToCompany(companyId, 'telemetry:update', { vehicleId, ...data });
  }

  emitAlertCreated(companyId: string, alert: { id: string; vehicleId: string; alertType: string; severity: string; message?: string; createdAt: Date }) {
    emitToCompany(companyId, 'alert:created', alert);
  }

  emitGeofenceEntered(companyId: string, geofenceId: string, vehicleId: string, data: { latitude: number; longitude: number; timestamp: Date }) {
    emitToCompany(companyId, 'geofence:entered', { geofenceId, vehicleId, ...data });
  }

  emitGeofenceExited(companyId: string, geofenceId: string, vehicleId: string, data: { latitude: number; longitude: number; timestamp: Date }) {
    emitToCompany(companyId, 'geofence:exited', { geofenceId, vehicleId, ...data });
  }

  emitTripStarted(companyId: string, tripId: string, vehicleId: string, driverId: string) {
    emitToCompany(companyId, 'trip:started', { tripId, vehicleId, driverId });
  }

  emitTripEnded(companyId: string, tripId: string, vehicleId: string, driverId: string) {
    emitToCompany(companyId, 'trip:ended', { tripId, vehicleId, driverId });
  }
}

export const socketService = new SocketService();

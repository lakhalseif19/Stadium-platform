import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_endpoints.dart';
import 'models/reservation_model.dart';
import 'models/time_slot_model.dart';

class ReservationRepository {
  final ApiClient _apiClient;

  ReservationRepository(this._apiClient);

  Future<List<ReservationModel>> getReservations() async {
    final response = await _apiClient.dio.get(ApiEndpoints.myReservations);
    return (response.data as List)
        .map((json) => ReservationModel.fromJson(json))
        .toList();
  }

  Future<ReservationModel> getReservationDetail(String id) async {
    final reservations = await getReservations();
    return reservations.firstWhere((reservation) => reservation.id == id);
  }

  Future<ReservationModel> createReservation(Map<String, dynamic> data) async {
    final response =
        await _apiClient.dio.post(ApiEndpoints.reservations, data: data);
    return ReservationModel.fromJson(response.data);
  }

  Future<void> cancelReservation(String id) async {
    await _apiClient.dio.delete('${ApiEndpoints.reservations}/$id/cancel');
  }

  Future<String> getQrToken(String id) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.checkInQr,
      data: {'reservation_id': id},
    );
    return response.data['token'] as String;
  }

  Future<List<TimeSlotModel>> getAvailableSlots(
      String fieldId, String date) async {
    final response = await _apiClient.dio.get(
      ApiEndpoints.availability,
      queryParameters: {'field_id': fieldId, 'date': date},
    );
    return (response.data as List)
        .map((json) => TimeSlotModel.fromJson(json))
        .toList();
  }

  Future<ReservationModel> createBooking({
    required String fieldId,
    required String date,
    required String startTime,
  }) async {
    final startsAt = DateTime.parse('${date}T$startTime').toIso8601String();
    final response =
        await _apiClient.dio.post(ApiEndpoints.reservations, data: {
      'field_id': fieldId,
      'starts_at': startsAt,
      'coverage': 'FULL',
    });
    return ReservationModel.fromJson(response.data);
  }
}

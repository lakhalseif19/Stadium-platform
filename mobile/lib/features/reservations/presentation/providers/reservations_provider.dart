import 'package:flutter/material.dart';
import '../../data/reservation_repository.dart';
import '../../data/models/reservation_model.dart';
import '../../data/models/time_slot_model.dart';

class ReservationsProvider extends ChangeNotifier {
  final ReservationRepository _repository;

  ReservationsProvider(this._repository);

  List<ReservationModel> _reservations = [];
  bool _isLoading = false;
  String? _error;

  List<ReservationModel> get reservations => _reservations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchMyReservations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reservations = await _repository.getReservations();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createReservation(
      String fieldId, String date, String startTime, String endTime) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.createBooking(
        fieldId: fieldId,
        date: date,
        startTime: startTime,
      );
      await fetchMyReservations();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<ReservationModel?> getDetail(String id) async {
    try {
      return await _repository.getReservationDetail(id);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<List<TimeSlotModel>> getAvailableSlots(
      String fieldId, String date) async {
    try {
      return await _repository.getAvailableSlots(fieldId, date);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return [];
    }
  }

  Future<String?> getQrToken(String reservationId) async {
    try {
      return await _repository.getQrToken(reservationId);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }
}

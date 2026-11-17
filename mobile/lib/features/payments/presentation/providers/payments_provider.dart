import 'package:flutter/material.dart';
import '../../data/payment_repository.dart';

class PaymentsProvider extends ChangeNotifier {
  final PaymentRepository _repository;

  PaymentsProvider(this._repository);

  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<bool> processPayment(
      String reservationId, String paymentMethodId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.processPayment(reservationId, paymentMethodId);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}

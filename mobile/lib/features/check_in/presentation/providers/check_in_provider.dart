import 'package:flutter/material.dart';
import '../../data/check_in_repository.dart';

class CheckInProvider extends ChangeNotifier {
  final CheckInRepository _repository;

  CheckInProvider(this._repository);

  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<bool> scanQr(String qrToken) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.scanQr(qrToken);
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

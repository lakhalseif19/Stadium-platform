import 'package:flutter/material.dart';
import '../../data/stadium_repository.dart';
import '../../data/models/stadium_model.dart';

class StadiumsProvider extends ChangeNotifier {
  final StadiumRepository _repository;

  StadiumsProvider(this._repository);

  List<StadiumModel> _stadiums = [];
  bool _isLoading = false;
  String? _error;

  List<StadiumModel> get stadiums => _stadiums;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchStadiums({double? lat, double? lng}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _stadiums = await _repository.getStadiums(lat: lat, lng: lng);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

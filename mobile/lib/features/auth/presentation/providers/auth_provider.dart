import 'package:flutter/material.dart';

import '../../data/auth_repository.dart';
import '../../data/models/user_model.dart';
import '../../../../core/storage/secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repository;
  final SecureStorage _storage;

  UserModel? _user;
  String? _pendingVerificationPhone;
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._repository, this._storage) {
    _checkAuth();
  }

  // Getters
  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  bool get isGuard => _user?.role == 'GUARD';
  String? get pendingVerificationPhone => _pendingVerificationPhone;

  // Restore the saved session
  Future<void> _checkAuth() async {
    try {
      final token = await _storage.getToken();
      final role = await _storage.getRole();

      if (token != null &&
          token.isNotEmpty &&
          role != null &&
          role.isNotEmpty) {
        _user = UserModel(
          id: 'me',
          phone: '',
          role: role,
        );
      }
    } catch (e) {
      _error = 'Unable to restore your session.';
    } finally {
      notifyListeners();
    }
  }

  // Login
  Future<bool> login(String phone, String password) async {
    _setLoading(true);
    _error = null;

    try {
      final normalizedPhone = phone.trim();

      if (normalizedPhone.isEmpty || password.isEmpty) {
        throw Exception('Please enter your phone number and password.');
      }

      final response = await _repository.login(
        normalizedPhone,
        password,
      );

      // The response model must match the backend API response.
      await _storage.saveTokens(
        token: response.token,
        refreshToken: response.refreshToken,
      );

      _user = response.user;
      await _storage.saveRole(response.user.role);

      return true;
    } catch (e) {
      _error = _readableError(e);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Register
  Future<bool> register(
    String phone,
    String password,
    String name,
  ) async {
    _setLoading(true);
    _error = null;

    try {
      final normalizedPhone = phone.trim();
      final normalizedName = name.trim();

      if (normalizedPhone.isEmpty) {
        throw Exception('Please enter your phone number.');
      }

      if (password.length < 8) {
        throw Exception('Password must contain at least 8 characters.');
      }

      if (normalizedName.isEmpty) {
        throw Exception('Please enter your full name.');
      }

      final parts = normalizedName
          .split(RegExp(r'\s+'))
          .where((part) => part.isNotEmpty)
          .toList();

      if (parts.length < 2) {
        throw Exception('Please enter your first and last name.');
      }

      final firstName = parts.first;
      final lastName = parts.skip(1).join(' ');

      // Registration returns a user ID, not authentication tokens.
      await _repository.register(
        normalizedPhone,
        password,
        firstName,
        lastName,
      );

      // The user must verify their phone and then log in.
      // Do not save tokens or mark the user as authenticated here.
      _pendingVerificationPhone = normalizedPhone;
      return true;
    } catch (e) {
      _error = _readableError(e);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> verifyPhoneOtp(String code) async {
    final phone = _pendingVerificationPhone;
    if (phone == null) {
      _error = 'Register again before verifying your phone number.';
      notifyListeners();
      return false;
    }

    _setLoading(true);
    _error = null;
    try {
      await _repository.verifyOtp(phone, code.trim());
      _pendingVerificationPhone = null;
      return true;
    } catch (e) {
      _error = _readableError(e);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _repository.logout();
    } catch (_) {
      // Clear local credentials even when the server cannot be reached.
    }
    try {
      await _storage.clearAll();
    } catch (e) {
      _error = 'Unable to clear the saved session.';
    } finally {
      _user = null;
      notifyListeners();
    }
  }

  // Loading state
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  // Basic error formatting
  String _readableError(Object error) {
    final message = error.toString();

    if (message.startsWith('Exception: ')) {
      return message.substring('Exception: '.length);
    }

    return message;
  }
}

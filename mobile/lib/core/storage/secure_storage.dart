import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _roleKey = 'user_role';

  Future<void> saveTokens(
      {required String token, required String refreshToken}) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<String?> getToken() async => await _storage.read(key: _tokenKey);
  Future<String?> getRefreshToken() async =>
      await _storage.read(key: _refreshTokenKey);

  Future<void> saveRole(String role) async =>
      await _storage.write(key: _roleKey, value: role);
  Future<String?> getRole() async => await _storage.read(key: _roleKey);

  Future<void> clearAll() async => await _storage.deleteAll();
}

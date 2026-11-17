import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_endpoints.dart';
import 'models/auth_response.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository(this._apiClient);

  Future<AuthResponse> login(String phone, String password) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.login,
      data: {
        'phone': phone,
        'password': password,
      },
    );

    return AuthResponse.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<Map<String, dynamic>> register(
    String phone,
    String password,
    String firstName,
    String lastName,
  ) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.register,
      data: {
        'phone': phone,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
      },
    );

    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> verifyOtp(String phone, String code) async {
    await _apiClient.dio.post(
      ApiEndpoints.verifyOtp,
      data: {'phone': phone, 'code': code},
    );
  }

  Future<void> logout() async {
    await _apiClient.dio.post(ApiEndpoints.logout);
  }
}

import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import '../constants/api_endpoints.dart';

class AuthInterceptor extends Interceptor {
  final SecureStorage _storage;
  final Dio _dio;

  AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getToken();
    if (token != null && !options.headers.containsKey('Authorization')) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 &&
        err.requestOptions.extra['skipAuthRefresh'] != true) {
      // Handle refresh token
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken != null) {
        try {
          final response = await _dio.post(
            ApiEndpoints.refresh,
            data: {'refreshToken': refreshToken},
            options: Options(
              headers: {'Authorization': 'Bearer $refreshToken'},
              extra: {'skipAuthRefresh': true},
            ),
          );
          if (response.statusCode == 200) {
            final newToken = response.data['accessToken'];
            final newRefresh = response.data['refreshToken'];
            await _storage.saveTokens(
                token: newToken, refreshToken: newRefresh);

            // Retry original request
            err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
            err.requestOptions.extra['skipAuthRefresh'] = true;
            final retryResponse = await _dio.fetch(err.requestOptions);
            return handler.resolve(retryResponse);
          }
        } catch (e) {
          await _storage.clearAll();
          // Navigate to login
        }
      }
    }
    return handler.next(err);
  }
}

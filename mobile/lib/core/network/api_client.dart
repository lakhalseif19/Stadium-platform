import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import 'auth_interceptor.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  late final Dio dio;

  ApiClient(SecureStorage storage) {
    dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(milliseconds: AppConstants.connectTimeout),
      receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    dio.interceptors.add(AuthInterceptor(storage, dio));
  }
}

class AppConstants {
  static const String appName = 'Stadium Platform Sétif';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  static const int wilayaCode = 19;
  static const String currency = 'DZD';

  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}

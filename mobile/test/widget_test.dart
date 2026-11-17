import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:stadium_platform_mobile/app.dart';
import 'package:stadium_platform_mobile/core/network/api_client.dart';
import 'package:stadium_platform_mobile/core/storage/secure_storage.dart';
import 'package:stadium_platform_mobile/features/auth/data/auth_repository.dart';
import 'package:stadium_platform_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:stadium_platform_mobile/features/auth/data/models/auth_response.dart';

class _TestSecureStorage extends SecureStorage {
  @override
  Future<String?> getToken() async => null;

  @override
  Future<String?> getRole() async => null;
}

void main() {
  test('auth response reads the backend accessToken field', () {
    final response = AuthResponse.fromJson({
      'accessToken': 'access-token',
      'refreshToken': 'refresh-token',
      'user': {'id': 'user-id', 'phone': '+213555000000', 'role': 'CITIZEN'},
    });

    expect(response.token, 'access-token');
    expect(response.refreshToken, 'refresh-token');
  });

  testWidgets('application starts on the sign-in screen when signed out',
      (tester) async {
    final storage = _TestSecureStorage();
    final apiClient = ApiClient(storage);
    final authProvider = AuthProvider(AuthRepository(apiClient), storage);

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthProvider>.value(
        value: authProvider,
        child: const StadiumApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Login'), findsOneWidget);
  });
}

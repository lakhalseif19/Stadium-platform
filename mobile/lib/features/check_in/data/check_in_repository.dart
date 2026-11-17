import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_endpoints.dart';

class CheckInRepository {
  final ApiClient _apiClient;

  CheckInRepository(this._apiClient);

  Future<void> scanQr(String qrToken) async {
    await _apiClient.dio
        .post(ApiEndpoints.checkInScan, data: {'token': qrToken});
  }
}

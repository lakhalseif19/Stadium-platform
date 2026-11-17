import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_endpoints.dart';
import 'models/payment_model.dart';

class PaymentRepository {
  final ApiClient _apiClient;

  PaymentRepository(this._apiClient);

  Future<PaymentModel> processPayment(
      String reservationId, String paymentMethodId) async {
    final response = await _apiClient.dio.post(
      ApiEndpoints.payments,
      data: {
        'reservationId': reservationId,
        'paymentMethodId': paymentMethodId
      },
    );
    return PaymentModel.fromJson(response.data);
  }
}

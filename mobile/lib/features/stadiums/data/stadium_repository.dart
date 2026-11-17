import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_endpoints.dart';
import 'models/stadium_model.dart';
import 'models/field_model.dart';

class StadiumRepository {
  final ApiClient _apiClient;

  StadiumRepository(this._apiClient);

  Future<List<StadiumModel>> getStadiums({double? lat, double? lng}) async {
    final Map<String, dynamic> query = {};
    if (lat != null && lng != null) {
      query['latitude'] = lat;
      query['longitude'] = lng;
    }

    final response =
        await _apiClient.dio.get(ApiEndpoints.stadiums, queryParameters: query);
    final rows = response.data is Map<String, dynamic>
        ? response.data['data'] as List
        : response.data as List;
    return rows.map((json) => StadiumModel.fromJson(json)).toList();
  }

  Future<StadiumModel> getStadiumDetail(String id) async {
    final response = await _apiClient.dio.get('${ApiEndpoints.stadiums}/$id');
    return StadiumModel.fromJson(response.data);
  }

  Future<List<FieldModel>> getFieldsForStadium(String stadiumId) async {
    final response = await _apiClient.dio
        .get(ApiEndpoints.fields, queryParameters: {'stadium_id': stadiumId});
    return (response.data as List)
        .map((json) => FieldModel.fromJson(json))
        .toList();
  }
}

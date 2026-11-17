import 'field_model.dart';

class StadiumModel {
  final String id;
  final String name;
  final String description;
  final double latitude;
  final double longitude;
  final String address;
  final List<FieldModel> fields;

  StadiumModel({
    required this.id,
    required this.name,
    required this.description,
    required this.latitude,
    required this.longitude,
    required this.address,
    this.fields = const [],
  });

  factory StadiumModel.fromJson(Map<String, dynamic> json) {
    return StadiumModel(
      id: json['id'],
      name: (json['name_fr'] ?? json['name_en'] ?? json['name_ar'] ?? '')
          as String,
      description:
          (json['description'] ?? json['commune_name'] ?? '') as String,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      address: json['address'] ?? '',
      fields: json['fields'] != null
          ? (json['fields'] as List).map((e) => FieldModel.fromJson(e)).toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'fields': fields.map((e) => e.toJson()).toList(),
    };
  }
}

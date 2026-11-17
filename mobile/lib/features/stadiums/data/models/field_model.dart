class FieldModel {
  final String id;
  final String stadiumId;
  final String name;
  final String type;
  final double pricePerHour;
  final String bookingMode;

  FieldModel({
    required this.id,
    required this.stadiumId,
    required this.name,
    required this.type,
    required this.pricePerHour,
    required this.bookingMode,
  });

  factory FieldModel.fromJson(Map<String, dynamic> json) {
    return FieldModel(
      id: json['id'],
      stadiumId: json['stadium_id'] as String,
      name: (json['name_fr'] ?? json['name_en'] ?? json['name_ar'] ?? '')
          as String,
      type: (json['type'] ?? '') as String,
      pricePerHour: (json['pricePerHour'] as num?)?.toDouble() ?? 0,
      bookingMode: json['booking_mode'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'stadiumId': stadiumId,
      'name': name,
      'type': type,
      'pricePerHour': pricePerHour,
      'bookingMode': bookingMode,
    };
  }
}

class ReservationModel {
  final String id;
  final String fieldId;
  final String userId;
  final String date;
  final String startTime;
  final String endTime;
  final String status;
  final String? qrToken;

  ReservationModel({
    required this.id,
    required this.fieldId,
    required this.userId,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.qrToken,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    return ReservationModel(
      id: json['id'],
      fieldId: json['field_id'] as String,
      userId: json['user_id'] as String? ?? '',
      date: DateTime.parse(json['starts_at'] as String)
          .toLocal()
          .toIso8601String()
          .split('T')
          .first,
      startTime: DateTime.parse(json['starts_at'] as String)
          .toLocal()
          .toIso8601String()
          .split('T')
          .last
          .substring(0, 5),
      endTime: DateTime.parse(json['ends_at'] as String)
          .toLocal()
          .toIso8601String()
          .split('T')
          .last
          .substring(0, 5),
      status: json['status'],
      qrToken: json['qrToken'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fieldId': fieldId,
      'userId': userId,
      'date': date,
      'startTime': startTime,
      'endTime': endTime,
      'status': status,
      'qrToken': qrToken,
    };
  }
}

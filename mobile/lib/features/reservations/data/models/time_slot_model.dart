class TimeSlotModel {
  final String startTime;
  final String endTime;
  final bool isAvailable;
  final double? price;

  TimeSlotModel({
    required this.startTime,
    required this.endTime,
    required this.isAvailable,
    this.price,
  });

  factory TimeSlotModel.fromJson(Map<String, dynamic> json) {
    return TimeSlotModel(
      startTime: json['startTime'],
      endTime: json['endTime'],
      isAvailable: json['isAvailable'],
      price: json['price'] != null ? (json['price'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'startTime': startTime,
      'endTime': endTime,
      'isAvailable': isAvailable,
      'price': price,
    };
  }
}

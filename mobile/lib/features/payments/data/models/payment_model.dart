class PaymentModel {
  final String id;
  final String reservationId;
  final double amount;
  final String status;
  final String transactionDate;

  PaymentModel({
    required this.id,
    required this.reservationId,
    required this.amount,
    required this.status,
    required this.transactionDate,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'],
      reservationId: json['reservationId'],
      amount: (json['amount'] as num).toDouble(),
      status: json['status'],
      transactionDate: json['transactionDate'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reservationId': reservationId,
      'amount': amount,
      'status': status,
      'transactionDate': transactionDate,
    };
  }
}

class UserModel {
  final String id;
  final String phone;
  final String role;
  final String? name;

  UserModel({
    required this.id,
    required this.phone,
    required this.role,
    this.name,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      phone: json['phone'],
      role: json['role'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'role': role,
      'name': name,
    };
  }
}

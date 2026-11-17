import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/stadiums_provider.dart';
import '../../../../core/widgets/field_card.dart';

class StadiumDetailScreen extends StatelessWidget {
  final String stadiumId;
  const StadiumDetailScreen({super.key, required this.stadiumId});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<StadiumsProvider>();
    final stadium =
        provider.stadiums.where((item) => item.id == stadiumId).isNotEmpty
            ? provider.stadiums.firstWhere((item) => item.id == stadiumId)
            : null;

    if (stadium == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Stadium')),
        body: const Center(
          child: Text('Stadium not found.'),
        ),
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(stadium.name),
              background: Hero(
                tag: 'stadium_${stadium.id}',
                child: Container(
                  color: Colors.green.shade200,
                  child:
                      const Icon(Icons.stadium, size: 100, color: Colors.green),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Description',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(stadium.description),
                  const SizedBox(height: 16),
                  const Text('Fields',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final field = stadium.fields[index];
                return FieldCard(
                  field: field,
                  onTap: () => context.push('/reservations/create/${field.id}'),
                );
              },
              childCount: stadium.fields.length,
            ),
          )
        ],
      ),
    );
  }
}

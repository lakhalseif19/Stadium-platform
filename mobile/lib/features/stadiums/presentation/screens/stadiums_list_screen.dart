import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/stadiums_provider.dart';
import '../../../../core/widgets/stadium_card.dart';
import '../../../../core/widgets/loading_indicator.dart';
import '../../../../core/widgets/error_widget.dart';
import '../../../../core/widgets/empty_state.dart';

class StadiumsListScreen extends StatefulWidget {
  const StadiumsListScreen({super.key});

  @override
  State<StadiumsListScreen> createState() => _StadiumsListScreenState();
}

class _StadiumsListScreenState extends State<StadiumsListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StadiumsProvider>().fetchStadiums();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stadiums'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.push('/profile'),
          )
        ],
      ),
      body: Consumer<StadiumsProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) return const CustomLoadingIndicator();
          if (provider.error != null) {
            return CustomErrorWidget(
                message: provider.error!, onRetry: provider.fetchStadiums);
          }
          if (provider.stadiums.isEmpty) {
            return const EmptyStateWidget(
                message: 'No stadiums found.', icon: Icons.sports_soccer);
          }
          return ListView.builder(
            itemCount: provider.stadiums.length,
            itemBuilder: (context, index) {
              final stadium = provider.stadiums[index];
              return StadiumCard(
                stadium: stadium,
                onTap: () => context.push('/stadiums/${stadium.id}'),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/reservations'),
        child: const Icon(Icons.calendar_month),
      ),
    );
  }
}

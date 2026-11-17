import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/reservations_provider.dart';
import '../../data/models/time_slot_model.dart';
import '../../../../core/widgets/loading_indicator.dart';

class CreateReservationScreen extends StatefulWidget {
  final String fieldId;
  const CreateReservationScreen({super.key, required this.fieldId});

  @override
  State<CreateReservationScreen> createState() =>
      _CreateReservationScreenState();
}

class _CreateReservationScreenState extends State<CreateReservationScreen> {
  DateTime _selectedDate = DateTime.now();
  List<TimeSlotModel> _slots = [];
  bool _isLoadingSlots = false;
  TimeSlotModel? _selectedSlot;

  @override
  void initState() {
    super.initState();
    _fetchSlots();
  }

  void _fetchSlots() async {
    setState(() => _isLoadingSlots = true);
    final provider = context.read<ReservationsProvider>();
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final slots = await provider.getAvailableSlots(widget.fieldId, dateStr);
    if (!mounted) return;
    setState(() {
      _slots = slots;
      _isLoadingSlots = false;
      _selectedSlot = null;
    });
  }

  void _submit() async {
    if (_selectedSlot == null) return;
    final provider = context.read<ReservationsProvider>();
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    final success = await provider.createReservation(
      widget.fieldId,
      dateStr,
      _selectedSlot!.startTime,
      _selectedSlot!.endTime,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Reservation created!')));
      context.pop();
    } else if (mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Field')),
      body: Column(
        children: [
          CalendarDatePicker(
            initialDate: _selectedDate,
            firstDate: DateTime.now(),
            lastDate: DateTime.now().add(const Duration(days: 7)),
            onDateChanged: (date) {
              setState(() => _selectedDate = date);
              _fetchSlots();
            },
          ),
          const Divider(),
          Expanded(
            child: _isLoadingSlots
                ? const CustomLoadingIndicator()
                : _slots.isEmpty
                    ? const Center(
                        child: Text('No slots available for this date.'))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          childAspectRatio: 2.5,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                        ),
                        itemCount: _slots.length,
                        itemBuilder: (context, index) {
                          final slot = _slots[index];
                          final isSelected = _selectedSlot == slot;
                          return ChoiceChip(
                            label: Text(slot.startTime),
                            selected: isSelected,
                            onSelected: slot.isAvailable
                                ? (selected) {
                                    setState(() =>
                                        _selectedSlot = selected ? slot : null);
                                  }
                                : null,
                            selectedColor: Colors.green,
                            disabledColor: Colors.grey.shade300,
                          );
                        },
                      ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedSlot != null ? _submit : null,
                child: const Text('Confirm Booking'),
              ),
            ),
          )
        ],
      ),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { FieldsRepository } from './fields.repository';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { NotFoundException, BadRequestException } from '../common/exceptions';

@Injectable()
export class FieldsService {
  constructor(
    private readonly repo: FieldsRepository,
    private readonly auditService: AuditService,
  ) {}

  private validateTimes(opensAt: string, closesAt: string) {
    const [oh, om] = opensAt.split(':').map(Number);
    const [ch, cm] = closesAt.split(':').map(Number);
    if (oh * 60 + om >= ch * 60 + cm)
      throw new BadRequestException('opens_at must be before closes_at');
  }

  async create(dto: CreateFieldDto, userId: string, ipAddress?: string) {
    this.validateTimes(dto.opens_at, dto.closes_at);
    const field = await this.repo.create(dto);
    await this.auditService.log(userId, 'CREATE', 'FIELD', field.id, null, field, ipAddress);
    return field;
  }

  async findByStadium(stadium_id: string) {
    return this.repo.findByStadium(stadium_id);
  }

  async findById(id: string) {
    const field = await this.repo.findById(id);
    if (!field) throw new NotFoundException('Field not found');
    return field;
  }

  async update(id: string, dto: UpdateFieldDto, userId: string, ipAddress?: string) {
    const oldField = await this.findById(id);
    if (dto.opens_at || dto.closes_at) {
      this.validateTimes(dto.opens_at || oldField.opens_at, dto.closes_at || oldField.closes_at);
    }
    const field = await this.repo.update(id, dto);
    await this.auditService.log(userId, 'UPDATE', 'FIELD', field.id, oldField, field, ipAddress);
    return field;
  }

  async toggleActive(id: string, userId: string, ipAddress?: string) {
    const oldField = await this.findById(id);
    const field = await this.repo.toggleActive(id);
    await this.auditService.log(
      userId,
      'TOGGLE_ACTIVE',
      'FIELD',
      field.id,
      { is_active: oldField.is_active },
      { is_active: field.is_active },
      ipAddress,
    );
    return field;
  }
}

import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { StadiumsRepository } from './stadiums.repository';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';
import { SearchStadiumsDto } from './dto/search-stadiums.dto';
import { NotFoundException } from '../common/exceptions';

@Injectable()
export class StadiumsService {
  constructor(
    private readonly stadiumsRepository: StadiumsRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateStadiumDto, userId: string, ipAddress?: string) {
    const stadium = await this.stadiumsRepository.create(dto);
    await this.auditService.log(userId, 'CREATE', 'STADIUM', stadium.id, null, stadium, ipAddress);
    return stadium;
  }

  async findAll(searchDto: SearchStadiumsDto) {
    return this.stadiumsRepository.findAll(searchDto);
  }

  async findById(id: string) {
    const stadium = await this.stadiumsRepository.findById(id);
    if (!stadium) {
      throw new NotFoundException('Stadium not found');
    }
    return stadium;
  }

  async update(id: string, dto: UpdateStadiumDto, userId: string, ipAddress?: string) {
    const oldStadium = await this.findById(id);
    const stadium = await this.stadiumsRepository.update(id, dto);
    await this.auditService.log(
      userId,
      'UPDATE',
      'STADIUM',
      stadium.id,
      oldStadium,
      stadium,
      ipAddress,
    );
    return stadium;
  }

  async toggleActive(id: string, userId: string, ipAddress?: string) {
    const oldStadium = await this.findById(id);
    const stadium = await this.stadiumsRepository.toggleActive(id);
    await this.auditService.log(
      userId,
      'TOGGLE_ACTIVE',
      'STADIUM',
      stadium.id,
      { is_active: oldStadium.is_active },
      { is_active: stadium.is_active },
      ipAddress,
    );
    return stadium;
  }
}

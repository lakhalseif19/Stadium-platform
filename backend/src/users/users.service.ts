import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private repo: UsersRepository) {}

  async findAll(limit = 10, offset = 0) {
    return this.repo.findAll(limit, offset);
  }

  async findById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const hash = await argon2.hash(dto.password);
    return this.repo.create(dto, hash);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.repo.update(id, dto);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleActive(id: string) {
    return this.repo.toggleActive(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logs } from './logs.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Logs)
    private logsRepo: Repository<Logs>,
  ) {}

  async findAll() {
    return await this.logsRepo.find({ relations: ['user'] });
  }

  async createLog(data: Partial<Logs>) {
    const log = this.logsRepo.create(data);
    return await this.logsRepo.save(log);
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogsService } from '../logs.service';
import { Logs } from '../logs.entity';
import { WinstonModule } from 'nest-winston'; // 1. 引入
describe('LogsService', () => {
  let service: LogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // 2. 在 imports 中 Mock 掉 WinstonModule
      imports: [WinstonModule.forRoot({})],
      providers: [
        LogsService,
        {
          provide: getRepositoryToken(Logs),
          useValue: {} as Repository<Logs>,
        },
      ],
    }).compile();
    service = module.get<LogsService>(LogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

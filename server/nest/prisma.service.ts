import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { db } from '../db.ts';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    console.log('⚡ Prisma Service initialized for MySQL / Persistent Engine');
  }

  async onModuleDestroy() {
    console.log('⚡ Prisma Service gracefully disconnected');
  }

  get client() {
    return db;
  }
}

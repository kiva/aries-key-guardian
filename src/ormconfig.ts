import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// @tothink we could also use Typeorm's environment variables feature:
// https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables
export function OrmConfig(): DynamicModule {
  return TypeOrmModule.forRoot({
    type: 'postgres',
    synchronize: false,
    migrationsRun: true,
    entities: ['src/entity/**/*.ts', 'dist/entity/**/*.js'],
    migrations: ['dist/migration/**/*.js'],
    host: process.env.POSTGRES_HOST,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    port: parseInt(process.env.POSTGRES_PORT, 10),
  });
}

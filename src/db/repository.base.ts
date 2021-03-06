import { QueryRunner, Repository } from 'typeorm';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';

export abstract class RepositoryBase<Entity extends ObjectLiteral> {

    constructor(
        protected readonly repository: Repository<Entity>
    ) {}

    /**
     * Helper function to support executing database actions transactionally. Database actions must use the provided EntityManager in order to be
     * executed transactionally.
     */
    protected async runInTransaction<T>(fun: (EntityManager) => Promise<T>): Promise<T> {
        const queryRunner: QueryRunner = this.repository.queryRunner;
        await queryRunner.startTransaction();
        try {
            return fun(queryRunner.manager);
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

}

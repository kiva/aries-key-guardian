import { EntityManager, Repository } from 'typeorm';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';

export abstract class BaseDbGateway<Entity extends ObjectLiteral> {

    constructor(
        protected readonly repository: Repository<Entity>
    ) {}

    /**
     * Helper function to support executing database actions transactionally. Database actions must use the provided EntityManager in order to be
     * executed transactionally.
     */
    protected async runInTransaction<T>(fun: (entityManager: EntityManager) => Promise<T>): Promise<T> {
        return this.repository.manager.transaction(fun);
    }

}

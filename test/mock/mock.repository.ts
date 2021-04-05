import { FindConditions } from 'typeorm/find-options/FindConditions';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { EntityManager } from 'typeorm';

/**
 * Provides a mock repository that holds onto a single immutable entity of type T. This mimics how an in-memory update to an entity wouldn't affect
 * the underlying stored entity in the db.
 */
export class MockRepository<Entity> {

    public readonly manager: MockEntityManager<Entity>;

    constructor(protected entities: Readonly<Entity>[]) {
        if (entities.length === 0) {
            throw new Error('Must provide Repository with at least 1 entity');
        }
        this.manager = new MockEntityManager<Entity>(this);
    }

    findOne(conditions?: FindConditions<Entity>): Promise<Entity | undefined> {
        return Promise.resolve(this.entities[0]);
    }

    find(conditions?: FindConditions<Entity>): Promise<Entity[]> {
        return Promise.resolve(this.entities);
    }

    count(): number {
        return this.entities.length;
    }

    save(input: Entity): Promise<Entity> {
        this.entities.push(input);
        return Promise.resolve(input);
    }
}

class MockEntityManager<Entity> {

    constructor(private readonly repository: MockRepository<Entity>) {}

    async findOne(entityClass: EntityTarget<Entity>, conditions?: FindConditions<Entity>): Promise<Entity | undefined> {
        return await this.repository.findOne(conditions);
    }

    save(entityClass: EntityTarget<Entity>, entity: Entity) {
        return this.repository.save(entity);
    }

    transaction(fun: (entityManager: EntityManager) => Promise<Entity>) {
        return fun(this as unknown as EntityManager);
    }
}

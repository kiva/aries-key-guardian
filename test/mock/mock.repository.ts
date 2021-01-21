import { FindConditions } from 'typeorm/find-options/FindConditions';

/**
 * Provides a mock repository that holds onto a single immutable entity of type T. This mimics how an in-memory update to an entity wouldn't affect
 * the underlying stored entity in the db.
 *
 * One caveat: find and findOne return a copy of the immutable entity... i.e. all its fields are readonly. This encourages application code to treat
 * objects as immutable as well.
 */
export class MockRepository<T> {

    constructor(private entities: Readonly<T>[]) {
        if (entities.length === 0) {
            throw new Error('Must provide Repository with at least 1 entity');
        }
    }

    findOne(conditions?: FindConditions<T>): Promise<T | undefined> {
        return Promise.resolve(this.entities[0]);
    }

    find(conditions?: FindConditions<T>): Promise<T[]> {
        return Promise.resolve(this.entities);
    }

    count(): number {
        return 1;
    }

    save(input: T): boolean {
        this.entities.push(input);
        return true;
    }
}

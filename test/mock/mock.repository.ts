/**
 * Provides a mock repository that holds onto a single immutable entity of type T. This mimics how an in-memory update to an entity wouldn't affect
 * the underlying stored entity in the db.
 *
 * One caveat: find and findOne return a copy of the immutable entity... i.e. all its fields are readonly. This encourages application code to treat
 * objects as immutable as well.
 */
export class MockRepository<T> {

    private frozenEntity: T;

    constructor(entity: T) {
        this.frozenEntity = Object.freeze(entity);
    }

    findOne(): T {
        return Object.assign({}, this.frozenEntity);
    }

    find(input: any): Array<T> {
        return [Object.assign({}, this.frozenEntity)];
    }

    count(): number {
        return 1;
    }

    save(input: T): boolean {
        this.frozenEntity = Object.freeze(input);
        return true;
    }
}
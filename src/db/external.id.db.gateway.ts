import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id.js';
import typeorm from 'typeorm';
import { CreateFiltersDto } from '../escrow/dto/create.filters.dto.js';
import { ProtocolErrorCode, ProtocolException, SecurityUtility } from 'protocol-common';

@Injectable()
export class ExternalIdDbGateway {

    constructor(
        @InjectRepository(ExternalId)
        private readonly externalIdRepository: typeorm.Repository<ExternalId>
    ) { }

    /**
     * This function will attempt to retrieve a single external IDs that corresponds to an id type and value. If the throwIfEmpty flag is set, then
     * the function will throw an error if there are no results.
     */
    public fetchExternalId(externalIdType: string, externalIdValue: string, throwIfEmpty = true): Promise<ExternalId | undefined> {
        const hashedId = SecurityUtility.hash32(externalIdValue + process.env.HASH_PEPPER);
        const findConditions: typeorm.FindConditions<ExternalId> = {
            external_id: hashedId,
            external_id_type: externalIdType
        };
        try {
            if (throwIfEmpty) {
                return this.externalIdRepository.findOneOrFail(findConditions);
            } else {
                return this.externalIdRepository.findOne(findConditions);
            }
        } catch (e) {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, `Cannot find an agentId for provided ID ${externalIdType}`);
        }
    }

    /**
     * This function will attempt to retrieve all external IDs that correspond to an id type -> value entry in the ids map. If the throwIfEmpty flag
     * is set, then the function will throw an error if there are no results.
     */
    public async fetchExternalIds(ids: Map<string, string>, throwIfEmpty = true): Promise<ExternalId[]> {

        // For each id, split the id by comma (in case it's a comma-separated list of id values) and hash them, then return a new map of the same
        // id type to the array of hashed values
        const hashedIds: Map<string, string[]> = new Map(
            Array.from(ids.entries()).map(([idType, idValues]: [string, string]) => {
                const hashedIdValues: string[] = idValues.split(',').map((idValue: string) => {
                    return SecurityUtility.hash32(idValue + process.env.HASH_PEPPER);
                });
                return [idType, hashedIdValues];
            })
        );

        // For each (idType, idValue) pair, search the db for ExternalIds that match that pair. Each query returns a Promise of one or more
        // ExternalIds, so wait for all those Promises and then flatten the results into a single array of ExternalIds.
        const externalIds: ExternalId[] = (
            await Promise.all(
                Array.from(hashedIds.entries())
                    .map(async ([idType, idValues]: [string, string[]]) => {
                        try {
                            return this.externalIdRepository.find({
                                external_id: typeorm.In(idValues),
                                external_id_type: idType
                            });
                        } catch (e) {
                            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, `Cannot find an agentId for provided ID ${idType}`);
                        }
                    })
            )
        ).flat();

        // Sometimes it's okay to return an empty array! Let's not be too prescriptive.
        if (throwIfEmpty && externalIds.length === 0) {
            const idTypes: string = Array.from(ids.keys()).join(', ');
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, `Cannot find an agentId for provided IDs ${idTypes}`);
        }

        return externalIds;
    }

    /**
     * This helper function turns agentId + filters into an array of ExternalId objects. It's just an in-memory operation that does not affect the db.
     */
    private buildExternalIds(agentId: string, filters: CreateFiltersDto): Array<ExternalId> {
        return Array.from(CreateFiltersDto.getIds(filters).entries()).map((entry: [string, string]) => {
            const externalId = new ExternalId();
            externalId.agent_id = agentId;
            externalId.external_id = SecurityUtility.hash32(entry[1] + process.env.HASH_PEPPER);
            externalId.external_id_type = entry[0];
            return externalId;
        });
    }

    /**
     * This function will attempt to create an external ID for every agentId + externalId pair provided.
     */
    public async createExternalIds(agentId: string, filters: CreateFiltersDto): Promise<Array<ExternalId>> {
        const externalIds: ExternalId[] = this.buildExternalIds(agentId, filters);
        let results: ExternalId[] = [];
        try {
            results = await this.externalIdRepository.save(externalIds);
        } catch (e) {
            const msg = externalIds.map((id: ExternalId) => `${id.external_id_type}`).join('; ');
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Entry already exists for ${msg}`);
        }
        return results;
    }

    /**
     * This function will attempt to retrieve an external ID that matches the provided externalId (same agentId, external_id, and external_id_type).
     * If no such match exists, then it will attempt to create one. If an entry with the same agentId and type (but different value) already exists,
     * then it will throw a ProtocolException.
     */
    private async getOrCreateExternalId(externalId: ExternalId): Promise<ExternalId> {
        return this.externalIdRepository.manager.transaction(async (entityManager: typeorm.EntityManager) => {
            const dbExternalId: ExternalId | undefined = await entityManager.findOne(ExternalId, {
                agent_id: externalId.agent_id,
                external_id: externalId.external_id,
                external_id_type: externalId.external_id_type
            });
            if (!dbExternalId) {
                try {
                    return await entityManager.save(externalId);
                } catch (e) {
                    throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Entry already exists for ${externalId.external_id_type}`);
                }
            } else {
                return dbExternalId;
            }
        });
    }

    public async getOrCreateExternalIds(agentId: string, filters: CreateFiltersDto): Promise<Array<ExternalId>> {
        const externalIds: ExternalId[] = this.buildExternalIds(agentId, filters);
        return Promise.all(externalIds.map((externalId: ExternalId) => this.getOrCreateExternalId(externalId)));
    }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { In, Repository } from 'typeorm';
import { SecurityUtility } from 'protocol-common/security.utility';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { CreateFiltersDto } from '../escrow/dto/create.filters.dto';

@Injectable()
export class ExternalIdService {

    constructor(
        @InjectRepository(ExternalId)
        private readonly externalIdRepository: Repository<ExternalId>
    ) {}

    public async fetchExternalIds(ids: Map<string, string>, throwIfEmpty: boolean = true): Promise<ExternalId[]> {

        // For each id, split the id by by comma (in case it's a comma separated list of id values) and hash them, then return a new map of the same
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
                                external_id: In(idValues),
                                external_id_type: idType
                            });
                        } catch (e) {
                            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, `Failed to retrieve a DID for provided IDs ${idType}`);
                        }
                    })
            )
        ).flat();

        // Sometimes it's okay to return an empty array! Let's not be too prescriptive.
        if (throwIfEmpty && externalIds.length === 0) {
            const idTypes: string = Array.from(ids.keys()).join(', ');
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, `Cannot find a DID for provided IDs ${idTypes}`);
        }

        return externalIds;
    }

    private buildExternalIds(did: string, filters: CreateFiltersDto): Array<ExternalId> {
        return Array.from(CreateFiltersDto.getIds(filters).entries()).map((entry: [string, string]) => {
            const externalId = new ExternalId();
            externalId.did = did;
            externalId.external_id = SecurityUtility.hash32(entry[1] + process.env.HASH_PEPPER);
            externalId.external_id_type = entry[0];
            return externalId;
        });
    }

    public async createExternalIds(did: string, filters: CreateFiltersDto): Promise<Array<ExternalId>> {
        const externalIds: ExternalId[] = this.buildExternalIds(did, filters);
        let results: ExternalId[] = [];
        try {
            results = await this.externalIdRepository.save(externalIds);
        } catch (e) {
            const msg = externalIds.map((id: ExternalId) => `${id.external_id_type}`).join('; ');
            throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Entry already exists for ${msg}`);
        }
        return results;
    }

    private async getOrCreateExternalId(externalId: ExternalId): Promise<ExternalId> {
        const dbExternalId = await this.externalIdRepository.findOne({
            did: externalId.did,
            external_id: externalId.external_id,
            external_id_type: externalId.external_id_type
        });
        const save: () => Promise<ExternalId> = async () => {
            try {
                return await this.externalIdRepository.save(externalId);
            } catch (e) {
                throw new ProtocolException(ProtocolErrorCode.DUPLICATE_ENTRY, `Entry already exists for ${externalId.external_id_type}`);
            }
        };
        return dbExternalId ?? await save();
    }

    public async getOrCreateExternalIds(did: string, filters: CreateFiltersDto): Promise<Array<ExternalId>> {
        const externalIds: ExternalId[] = this.buildExternalIds(did, filters);
        return Promise.all(externalIds.map((externalId: ExternalId) => this.getOrCreateExternalId(externalId)));
    }
}

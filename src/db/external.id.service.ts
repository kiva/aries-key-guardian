import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { In, Repository } from 'typeorm';
import { SecurityUtility } from 'protocol-common/security.utility';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolErrorCode } from 'protocol-common/protocol.errorcode';
import { CreateFiltersDto } from '../escrow/dto/create.filters.dto';
import { VerifyFiltersDto } from '../plugins/dto/verify.filters.dto';

@Injectable()
export class ExternalIdService {

    constructor(
        @InjectRepository(ExternalId)
        private readonly externalIdRepository: Repository<ExternalId>
    ) {}

    public async fetchExternalIds(filters: VerifyFiltersDto): Promise<ExternalId[]> {
        let idValues: string;
        let externalIdType: string;
        if (filters.externalId && filters.externalIdType) {
            idValues = filters.externalId;
            externalIdType = filters.externalIdType;
        } else if (filters.govId1 || filters.nationalId) {
            // TODO: Remove this check once we've removed the deprecated code (PRO-2676)
            idValues = filters.govId1 ?? filters.nationalId;
            externalIdType = 'sl_national_id';
        } else if (filters.govId2 || filters.voterId) {
            // TODO: Remove this check once we've removed the deprecated code (PRO-2676)
            idValues = filters.govId2 ?? filters.voterId;
            externalIdType = 'sl_voter_id';
        } else {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, 'No external ID provided to look up a DID');
        }
        const externalIdValues: string[] = idValues.split(',').map((idValue: string) => {
            return SecurityUtility.hash32(idValue + process.env.HASH_PEPPER);
        });

        // If we make it this far, we have something to look up
        const externalIds: ExternalId[] = await this.externalIdRepository.find({
            external_id: In(externalIdValues),
            external_id_type: externalIdType
        });
        if (externalIds.length === 0) {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, `Cannot find a DID for ${externalIdType}: ${idValues}`);
        }
        return externalIds;
    }

    public async createExternalIds(did: string, filters: CreateFiltersDto): Promise<Array<ExternalId>> {
        const externalIds: ExternalId[] = Array.from(filters.externalIds?.entries() ?? []).map((entry: [string, string]) => {
            const externalId = new ExternalId();
            externalId.did = did;
            externalId.external_id = entry[1];
            externalId.external_id_type = entry[0];
            return externalId;
        });
        // TODO: Remove these two checks once we've removed the deprecated code (PRO-2676)
        if (filters.govId1 || filters.nationalId) {
            const idValue: string = filters.govId1 ?? filters.nationalId;
            const externalId1 = new ExternalId();
            externalId1.did = did;
            externalId1.external_id = SecurityUtility.hash32(idValue + process.env.HASH_PEPPER);
            externalId1.external_id_type = 'sl_national_id'; // TODO: update to be specifiable by the filters
            externalIds.push(externalId1);
        }
        if (filters.govId2 || filters.voterId) {
            const idValue: string = filters.govId2 ?? filters.voterId;
            const externalId2 = new ExternalId();
            externalId2.did = did;
            externalId2.external_id = SecurityUtility.hash32(idValue + process.env.HASH_PEPPER);
            externalId2.external_id_type = 'sl_voter_id'; // TODO: update to be specifiable by the filters
            externalIds.push(externalId2);
        }
        return this.externalIdRepository.save(externalIds);
    }

    private async getOrCreateExternalId(externalId: ExternalId): Promise<ExternalId> {
        const dbExternalId = await this.externalIdRepository.findOne({
            did: externalId.did,
            external_id: externalId.external_id,
            external_id_type: externalId.external_id_type
        });
        return dbExternalId ?? await this.externalIdRepository.save(externalId);
    }

    public async getOrCreateExternalIds(did: string, filters: CreateFiltersDto): Promise<Array<ExternalId>> {
        const externalIds: ExternalId[] = Array.from(filters.externalIds?.entries() ?? []).map((entry: [string, string]) => {
            const externalId = new ExternalId();
            externalId.did = did;
            externalId.external_id = entry[1];
            externalId.external_id_type = entry[0];
            return externalId;
        });
        // TODO: Remove these two checks once we've removed the deprecated code (PRO-2676)
        if (filters.govId1 || filters.nationalId) {
            const idValue: string = filters.govId1 ?? filters.nationalId;
            const externalId1 = new ExternalId();
            externalId1.did = did;
            externalId1.external_id = SecurityUtility.hash32(idValue + process.env.HASH_PEPPER);
            externalId1.external_id_type = 'sl_national_id'; // TODO: update to be specifiable by the filters
            externalIds.push(externalId1);
        }
        if (filters.govId2 || filters.voterId) {
            const idValue: string = filters.govId2 ?? filters.voterId;
            const externalId2 = new ExternalId();
            externalId2.did = did;
            externalId2.external_id = SecurityUtility.hash32(idValue + process.env.HASH_PEPPER);
            externalId2.external_id_type = 'sl_voter_id'; // TODO: update to be specifiable by the filters
            externalIds.push(externalId2);
        }
        return Promise.all(externalIds.map((externalId: ExternalId) => this.getOrCreateExternalId(externalId)));
    }
}

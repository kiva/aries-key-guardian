import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExternalId } from './entity/external.id';
import { Repository } from 'typeorm';
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

    public async fetchExternalId(filters: VerifyFiltersDto): Promise<ExternalId> {
        let externalIdValue: string;
        let externalIdType: string;
        if (filters.externalId && filters.externalIdType) {
            externalIdValue = filters.externalId;
            externalIdType = filters.externalIdType;
        } else if (filters.govId1) {
            // TODO: Remove this check once we've removed the deprecated code (PRO-2676)
            externalIdValue = SecurityUtility.hash32(filters.govId1 + process.env.HASH_PEPPER);
            externalIdType = 'sl_national_id';
        } else if (filters.govId2) {
            // TODO: Remove this check once we've removed the deprecated code (PRO-2676)
            externalIdValue = SecurityUtility.hash32(filters.govId2 + process.env.HASH_PEPPER);
            externalIdType = 'sl_voter_id';
        } else {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, 'No external ID provided to look up a DID');
        }

        // If we make it this far, we have something to look up
        const externalId: ExternalId | undefined = await this.externalIdRepository.findOne({
            external_id: externalIdValue,
            external_id_type: externalIdType
        });
        if (!externalId) {
            throw new ProtocolException(ProtocolErrorCode.NO_CITIZEN_FOUND, `Cannot find a DID for ${externalIdType}: ${externalIdValue}`);
        }
        return externalId;
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
        if (filters.govId1) {
            const externalId1 = new ExternalId();
            externalId1.did = did;
            externalId1.external_id = SecurityUtility.hash32(filters.govId1 + process.env.HASH_PEPPER);
            externalId1.external_id_type = 'sl_national_id'; // TODO: update to be specifiable by the filters
            externalIds.push(externalId1);
        }
        if (filters.govId2) {
            const externalId2 = new ExternalId();
            externalId2.did = did;
            externalId2.external_id = SecurityUtility.hash32(filters.govId2 + process.env.HASH_PEPPER);
            externalId2.external_id_type = 'sl_voter_id'; // TODO: update to be specifiable by the filters
            externalIds.push(externalId2);
        }
        return this.externalIdRepository.save(externalIds);
    }
}

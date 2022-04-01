import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyObject } from 'class-validator';
import { isStringOrFail } from 'protocol-common/validation/validations/is.string';
import { throwValidationException } from 'protocol-common/validation/common/utility/error.utility';
import { isNumberOrFail } from 'protocol-common/validation/validations/is.number';

export class CreateFiltersDto {

    @ApiProperty({
        description: 'An object containing any number of IDs related to a particular Agent ID, as long as they all refer to the same Agent ID.'
    })
    @IsNotEmptyObject() readonly externalIds: object;

    public static getIds(filters: CreateFiltersDto): Map<string, string> {
        return new Map<string, string>(Object.entries(filters.externalIds).map((entry: [string, unknown]) => {
            try {
                isStringOrFail(entry[1]);
            } catch (e1) {
                try {
                    isNumberOrFail(entry[1]);
                } catch (e2) {
                    throwValidationException(['All external IDs must have either a string or numeric value']);
                }
            }
            return [entry[0], `${entry[1].toString()}`];
        }));
    }
}

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { FingerprintAuthDto } from './fingerprint.auth.dto';
import { ProtocolException } from '@kiva/protocol-common/protocol.exception';
import { Logger } from '@kiva/protocol-common/logger';
import { ProtocolErrorCode } from '@kiva/protocol-common/protocol.errorcode';

@Injectable()
export class DeviceValidationPipe implements PipeTransform {
    transform(value: FingerprintAuthDto, metadata: ArgumentMetadata) {
        const attributes = Object.keys(value.device);
        const missing = this.requiredDeviceAttributes().filter(item => attributes.indexOf(item) < 0);
        if (missing.length > 0) {
            throw new ProtocolException(ProtocolErrorCode.MISSING_DEVICE_DETAILS, 'Some device details are missing', { missing });
        }
        // Logging to loggly for now, but we may need a better solution.
        // Also only logging device details for now, trying to avoid sending filters which would include NIN
        Logger.log('fingerprint_access', {
            label: 'fingerprint_access',
            device: value.device,
        });

        return value;
    }

    /**
     * Theses are the only required device attributes for now, we may require more in the future
     */
    private requiredDeviceAttributes() {
        return [
            'FingerprintSensorSerialNumber',
            'TellerComputerUsername',
        ];
    }
}

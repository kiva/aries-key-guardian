import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

/**
 * This class is intended to hold all the "helper" methods that you might be tempted to mark as static and
 * that don't rely on state. It exists to make it easier to mockable such functionality and to help keep
 * other classes "clean" - i.e. to help segregate responsibilities.
 */
@Injectable()
export class SmsHelperService {

    /**
     * Generate exactly 6 digits so can't start with 0.
     */
    public generateRandomOtp(): number {
        // tslint:disable:no-bitwise
        const max = 999999;
        const min = 100000;
        const diff = max - min + 1;
        const numBits = Math.ceil(Math.log2(diff)); // min number of bits required to represent the diff
        const numBytes = Math.ceil(numBits / 4); // Must use bytes... min number of bytes required
        const mask = (1 << numBits) - 1; // If we get more bits than required, look only at what we need and discard the rest

        let randNum;
        do {
            randNum = crypto.randomBytes(numBytes).readUIntBE(0, numBytes);
            randNum = randNum & mask;
        } while (randNum >= diff);
        return randNum + min;
    }
}

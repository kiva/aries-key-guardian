/**
 * author: esmaeila
 * Defines the different Uris routed to auth service.
 */

export class V1Uri {
    public static readonly V1 = 'v1';
    public static readonly APP_PING = 'ping';
    public static readonly APP_HEALTHZ = 'healthz';

    public static readonly AUTH = V1Uri.V1 + '/auth';
    public static readonly AUTH_TOKEN = 'token';
    public static readonly AUTH_DETAILS_BY_DID = V1Uri.AUTH_TOKEN + '/did';
    public static readonly AUTH_FINGERPRINT = 'fingerprint';
    public static readonly AUTH_SMS = 'sms';
    public static readonly AUTH_FINGERPRINT_DID = V1Uri.AUTH_FINGERPRINT + '/did';
    public static readonly AUTH_CREDENTIALS = 'credentials';
    public static readonly AUTH_CREDENTIAL_TOKEN = 'credentialToken';
    public static readonly AUTH_EXISTS = 'exists';

    public static readonly KEY = V1Uri.V1 + '/key';
    public static readonly KEY_VERIFY = 'verify';

    public static readonly PERMISSIONS = V1Uri.V1 + '/permissions';
}

import typeorm from 'typeorm';

@typeorm.Entity()
export class WalletCredentials {

  /**
   * For simplicity we have an autogenerated integer id
   */
  @typeorm.PrimaryGeneratedColumn()
  id: number;

  /**
   * Typically the authentication microservices will return an agentId which can be used to look up wallet data. All agent Ids should be of length 32
   */
  @typeorm.Column({ length: 32, unique: true })
  agent_id: string;

  /**
   * Wallet ids are random unique uuids generated by the wallet server with the dashes stripped out
   */
  @typeorm.Column({ length: 32 })
  wallet_id: string;

  /**
   * Wallet keys are randomly generated by the wallet server
   */
  @typeorm.Column({ length: 32 })
  wallet_key: string;

  /**
   * Storing the seed here for convenience in case we need to regenerate Agent IDs in the future. We could store these in another table/db
   */
  @typeorm.Column({ length: 32 })
  seed: string;
}

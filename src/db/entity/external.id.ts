import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';


@Unique(['external_id', 'external_id_type'])
@Entity()
export class ExternalId {

    /**
     * For simplicity we have an autogenerated integer id
     */
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * The did of the entity this record refers to
     */
    @Index()
    @Column({ length: 32, unique: true })
    did: string;

    /**
     * The value of the external id referenced by this row (e.g. NIN55555).
     */
    @Index()
    @Column({ type: 'text' })
    external_id: string;

    /**
     * The type of external id referenced by this row (e.g. sl_national_id)
     */
    @Index()
    @Column({ type: 'text' })
    external_id_type: string;
}
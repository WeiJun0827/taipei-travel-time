import { BaseEntity, Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { MetroStation } from './MetroStation.js';

@Entity()
@Unique('uq_metro_transfer_from_station_id_to_station_id', ['fromStation', 'toStation'])
export class MetroTransfer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MetroStation)
  @JoinColumn({
    name: 'from_station_id',
    referencedColumnName: 'stationId',
    foreignKeyConstraintName: 'fk_metro_transfer_from_station_id',
  })
  fromStation: MetroStation;

  @ManyToOne(() => MetroStation)
  @JoinColumn({
    name: 'to_station_id',
    referencedColumnName: 'stationId',
    foreignKeyConstraintName: 'fk_metro_transfer_to_station_id',
  })
  toStation: MetroStation;

  @Column({ name: 'transfer_time_secs' })
  transferTimeSecs: number;
}
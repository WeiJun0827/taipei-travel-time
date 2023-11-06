import { BaseEntity, Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { MetroStation } from './MetroStation.js';

@Entity()
@Unique('uq_route_id_from_station_id_to_station_id', ['routeId', 'fromStation', 'toStation'])
export class MetroTransit extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'line_id' })
  lineId: string

  @Column({ name: 'route_id' })
  routeId: string

  @ManyToOne(() => MetroStation)
  @JoinColumn({
    name: 'from_station_id',
    referencedColumnName: 'stationId',
    foreignKeyConstraintName: 'fk_metro_transit_from_station_id',
  })
  fromStation: MetroStation

  @ManyToOne(() => MetroStation)
  @JoinColumn({
    name: 'to_station_id',
    referencedColumnName: 'stationId',
    foreignKeyConstraintName: 'fk_metro_transit_to_station_id',
  })
  toStation: MetroStation

  @Column({ name: 'dwell_time_secs', type: 'int' })
  dwellTimeSecs: number

  @Column({ name: 'run_time_secs', type: 'int' })
  runTimeSecs: number
}
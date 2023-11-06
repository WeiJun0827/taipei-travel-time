import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { MetroStation } from './MetroStation.js'

@Entity()
export class MetroTimetable extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'line_id' })
  lineId: string

  @Column({ name: 'route_id' })
  routeId: string

  @ManyToOne(() => MetroStation)
  @JoinColumn({
    name: 'station_id',
    referencedColumnName: 'stationId',
    foreignKeyConstraintName: 'fk_metro_timetable_station_id',
  })
  station: MetroStation

  @Column({ type: 'boolean' })
  weekdays: boolean

  @Column({ type: 'boolean' })
  saturday: boolean

  @Column({ type: 'boolean' })
  sunday: boolean

  @Column({ name: 'national_holidays', type: 'boolean' })
  nationalHolidays: boolean

  @Column({ type: 'simple-array' })
  timetable: string[]
}
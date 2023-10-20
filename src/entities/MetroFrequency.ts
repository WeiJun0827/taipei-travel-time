import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class MetroFrequency extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'line_id' })
  lineId: string

  @Column({ name: 'route_id' })
  routeId: string

  @Column({ type: 'boolean' })
  weekdays: boolean

  @Column({ type: 'boolean' })
  saturday: boolean

  @Column({ type: 'boolean' })
  sunday: boolean

  @Column({ name: 'national_holidays', type: 'boolean' })
  nationalHolidays: boolean

  @Column({ name:'start_time', type: 'time' })
  startTime: string

  @Column({ name:'end_time', type: 'time' })
  endTime: string
  
  @Column({ name: 'max_headway_secs', type: 'int' })
  maxHeadwaySecs: number

  @Column({ name: 'min_headway_secs', type: 'int' })
  minHeadwaySecs: number
}
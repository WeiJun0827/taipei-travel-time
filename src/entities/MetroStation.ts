import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'

@Entity()
export class MetroStation extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Index('idx_metro_station_station_id', { unique: true })
  @Column({ name: 'station_id' })
  stationId: string

  @Column({ name: 'name_cht' })
  nameCht: string

  @Column({ name: 'name_eng' })
  nameEng: string

  @Column('double')
  lat: number

  @Column('double')
  lon: number
}
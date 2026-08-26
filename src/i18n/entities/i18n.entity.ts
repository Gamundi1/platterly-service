import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class I18n {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  es: string;
}

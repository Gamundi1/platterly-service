import { TableStatus } from 'src/table/enum/table-status.enum';
import { BookingStatus } from '../enum/booking-status.enum';

export interface BookingInterface {
  id: string;
  guests: number;
  table: TableBookingInterface;
  hour: AvailableHourInterface;
  date: string;
  users: UserBookingInterface[];
  status: BookingStatus;
}

export interface AvailableHourInterface {
  id: string;
  interval: string;
}

export interface TableBookingInterface {
  number: number;
  status: TableStatus;
}

export interface UserBookingInterface {
  name: string;
  id: string;
}

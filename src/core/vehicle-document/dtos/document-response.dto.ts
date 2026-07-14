import { ApiProperty } from '@nestjs/swagger';

export class VehicleDocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  source: string;
}

export class VehicleDocumentsResponseDto {
  @ApiProperty({ type: [VehicleDocumentDto] })
  items: VehicleDocumentDto[];

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;
}

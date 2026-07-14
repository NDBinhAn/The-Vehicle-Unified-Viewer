import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { VehicleDocumentsResponseDto } from '../dtos/document-response.dto';
import { VehicleDocumentService } from '../services/vehicle-document.service';

@Controller('v1/vehicles')
@ApiTags('vehicle-document')
export class VehicleDocumentController {
  constructor(
    private readonly vehicleDocumentService: VehicleDocumentService,
  ) {}

  @Get(':vin/documents')
  @ApiOperation({ summary: 'Get unified vehicle documents for a VIN' })
  @ApiParam({ name: 'vin', example: '1HGCM82633A004352' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'size', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, type: VehicleDocumentsResponseDto })
  async getDocuments(
    @Param('vin') vin: string,
    @Query() query: PaginationQueryDto,
  ): Promise<VehicleDocumentsResponseDto> {
    if (!/^[A-Za-z0-9]{17}$/.test(vin)) {
      throw new BadRequestException(
        'VIN must be exactly 17 alphanumeric characters',
      );
    }

    return this.vehicleDocumentService.getDocuments(
      vin,
      query.page ?? 1,
      query.size ?? 10,
    );
  }
}

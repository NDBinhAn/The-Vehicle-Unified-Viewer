import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('mock-api/sales')
@ApiTags('mock-sales')
export class SalesMockController {
  private readonly records = new Map<
    string,
    Array<{ id: string; title: string; description: string; timestamp: string }>
  >([
    [
      '1HGCM82633A004352',
      [
        {
          id: 'sales-1',
          title: 'Purchase Contract',
          description: 'Vehicle sold to customer with full financing package.',
          timestamp: '2024-01-15T09:30:00.000Z',
        },
        {
          id: 'sales-2',
          title: 'Warranty Registration',
          description: 'Extended warranty activated for 36 months.',
          timestamp: '2024-01-20T11:15:00.000Z',
        },
      ],
    ],
    [
      'JH4KA8260MC000123',
      [
        {
          id: 'sales-3',
          title: 'Purchase Contract',
          description: 'Vehicle delivered to dealership fleet.',
          timestamp: '2024-02-10T08:15:00.000Z',
        },
      ],
    ],
    [
      '5YJSA1E21HF123456',
      [
        {
          id: 'sales-4',
          title: 'Purchase Contract',
          description: 'Vehicle transferred to retail customer.',
          timestamp: '2024-03-05T14:00:00.000Z',
        },
        {
          id: 'sales-5',
          title: 'Owner Update',
          description: 'Ownership records updated after transfer.',
          timestamp: '2024-03-06T10:20:00.000Z',
        },
      ],
    ],
  ]);

  @Get(':vin')
  @ApiOperation({ summary: 'Mock sales documents for a VIN' })
  @ApiParam({ name: 'vin', example: '1HGCM82633A004352' })
  getDocuments(@Param('vin') vin: string) {
    return {
      vin,
      documents: this.records.get(vin) ?? [],
    };
  }
}

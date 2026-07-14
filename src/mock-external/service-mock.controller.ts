import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('mock-api/service')
@ApiTags('mock-service')
export class ServiceMockController {
  private readonly records = new Map<
    string,
    Array<{ id: string; title: string; description: string; timestamp: string }>
  >([
    [
      '1HGCM82633A004352',
      [
        {
          id: 'service-1',
          title: 'Oil Change',
          description: 'Routine maintenance completed with synthetic oil.',
          timestamp: '2024-01-18T10:00:00.000Z',
        },
        {
          id: 'service-2',
          title: 'Brake Inspection',
          description: 'Brake pads inspected and rotated.',
          timestamp: '2024-02-02T13:40:00.000Z',
        },
      ],
    ],
    [
      'JH4KA8260MC000123',
      [
        {
          id: 'service-3',
          title: 'Battery Replacement',
          description: 'Battery replaced due to low voltage test.',
          timestamp: '2024-02-15T09:30:00.000Z',
        },
      ],
    ],
    [
      '5YJSA1E21HF123456',
      [
        {
          id: 'service-4',
          title: 'Tire Rotation',
          description: 'Tires rotated and balanced at 15k miles.',
          timestamp: '2024-03-08T16:20:00.000Z',
        },
      ],
    ],
  ]);

  @Get(':vin')
  @ApiOperation({ summary: 'Mock service documents for a VIN' })
  @ApiParam({ name: 'vin', example: '1HGCM82633A004352' })
  getDocuments(@Param('vin') vin: string) {
    return {
      vin,
      documents: this.records.get(vin) ?? [],
    };
  }
}

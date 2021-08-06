import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsumerService {
  getFoo(): string {
    return 'Foo';
  }
  getId(): string {
    //const getid =+ 1;
    return '1';  
  }
}

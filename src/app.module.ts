import { Module } from '@nestjs/common';
import { loadAdminJS } from './adminjs-loader';

@Module({})
export class AppModule {
  static async forRoot() {
    const { AdminModule } = await loadAdminJS();

    return {
      module: AppModule,
      imports: [
        AdminModule.createAdmin({
          adminJsOptions: {
            rootPath: '/admin',
          },
        }),
      ],
    };
  }
}

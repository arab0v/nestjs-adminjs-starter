import { Module } from '@nestjs/common';
import { loadAdminJS } from './adminjs-loader';

@Module({})
export class AdminModule {
  static async forRootAsync() {
    const { AdminJSModule } = await loadAdminJS();

    return {
      module: AdminModule,
      imports: [
        AdminJSModule.createAdmin({
          adminJsOptions: {
            rootPath: '/admin',
          },
        }),
      ],
    };
  }
}
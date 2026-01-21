I'm writing this blog because AdminJS decided to go with ESM in their latest version (v7) and make my life harder (a bit) because NestJS are still using CommonJS and theres [no plan to support esm](https://github.com/nestjs/nest/issues/13319).

### Simply my problem was:
Use `require('adminjs')` and you get a `ERR_REQUIRE_ESM`
Use normal import in TypeScript, wait for CJS to compile, again you get a `ERR_REQUIRE_ESM`

### But hold up isn't there official example?
There's this repo people point to: [dziraf/adminjs-v7-with-nestjs](https://github.com/dziraf/adminjs-v7-with-nestjs). It claims to show AdminJS v7 running smoothly with NestJS, and the AdminJS docs even link to it as an example.
Cool, right?
Except... have you actually tried cloning and running it?
It doesn't work. There's a known open issue that's been sitting there for years: Not running · [Issue #1](https://github.com/dziraf/adminjs-v7-with-nestjs/issues/1).

### The trick in one sentence

Load AdminJS and friends with **dynamic `import()`** inside async function and keep everything else CommonJS like it always was.


### Time to code

make sure to rollback all the changes form adminjs documentation first then lets start.

**Package Installation**

create new nest project in current dir if you didn't already 
```bash
nest new .
```

install all the boys. sequelize in my case and could be whatever you want just install orm's adapter from [adminjs docs](https://docs.adminjs.co/installation/adapters).
```bash 
npm install sequelize adminjs @adminjs/nestjs @adminjs/sequelize  @adminjs/express express-session express-formidable
```

create adminjs esm loader
```bash
touch src/adminjs-loader.ts
```

**src/adminjs-loader.ts**

```ts
// This file is the only place where we touch ESM stuff
export async function loadAdminJS() {
  const [adminjs, adminjsNest, sequelizeAdapter] = await Promise.all([
    import('adminjs'),
    import('@adminjs/nestjs'),
    import('@adminjs/sequelize'),
  ]);

  const AdminJS = adminjs.default;
  const { AdminModule } = adminjsNest;

  // Tell AdminJS to use Sequelize u can use any other orm adapter
  AdminJS.registerAdapter({
    Database: sequelizeAdapter.Database,
    Resource: sequelizeAdapter.Resource,
  });

  return { AdminJS, AdminModule };
}
```

**src/main.ts** (almost unchanged)

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // We let AppModule do async setup (including AdminJS)
  const rootModule = await AppModule.forRoot();
  const app = await NestFactory.create(rootModule);

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
```

**src/app.module.ts** (the place where you actually use it)

```ts
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
```

### Why this actually works well enough

- Dynamic `import()` is allowed in CommonJS files  
- Nothing else in your project needs to become ESM  
- No `"type": "module"` in package.json  
- No tsconfig `"module": "nodenext"` nightmare  
- No wrappers, no babel plugins, no weird loaders  
- You only pay the async price once at startup

### What usually goes wrong (heads up)

- Don’t do `import AdminJS from 'adminjs'` at the top of files — TypeScript will compile it → runtime crash
- Put all AdminJS-related imports **only** inside `loadAdminJS()`

### Resources thats lead me to this solution
- [DynamicModule](https://docs.nestjs.com/fundamentals/dynamic-modules) chapter from nestjs
- [Running esm packages in commonJS](https://stackoverflow.com/questions/70396400/how-to-use-es6-modules-in-commonjs)

### End
This is not the most beautiful solution.
But it’s small, contained, and lets you keep running AdminJS v7 today without rewriting half your monorepo or forcing ESM on the whole team.

Good luck.

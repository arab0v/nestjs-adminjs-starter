# AdminJS v7 with NestJS (CommonJS)

> **⚠️ Note:** This repository contains an improved version of the code compared to the [dev.to article](https://dev.to/arab0v/adminjs-v7-in-classic-nestjs-without-tears-23en). The article shows the basic approach, but the code here has been refactored for better organization (see the "Better project structure" section below).

---

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

create admin module folder to isolate the ESM mess
```bash
mkdir src/admin
touch src/admin/adminjs-loader.ts
touch src/admin/admin.module.ts
```

**src/admin/adminjs-loader.ts**

```ts
// This file is the only place where we touch ESM stuff
export async function loadAdminJS() {
  const [adminjs, adminjsNest, sequelizeAdapter] = await Promise.all([
    import('adminjs'),
    import('@adminjs/nestjs'),
    import('@adminjs/sequelize'),
  ]);

  const AdminJS = adminjs.default;
  const { AdminModule: AdminJSModule } = adminjsNest;

  // Tell AdminJS to use Sequelize u can use any other orm adapter
  AdminJS.registerAdapter({
    Database: sequelizeAdapter.Database,
    Resource: sequelizeAdapter.Resource,
  });

  return { AdminJS, AdminJSModule };
}
```

**src/admin/admin.module.ts**

```ts
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
```

**src/main.ts** (back to normal NestJS)

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

**src/app.module.ts** (clean and simple)

```ts
import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [AdminModule.forRootAsync()],
})
export class AppModule {}
```

### Why this actually works well enough

- Dynamic `import()` is allowed in CommonJS files
- Nothing else in your project needs to become ESM
- No `"type": "module"` in package.json
- No tsconfig `"module": "nodenext"` nightmare
- No wrappers, no babel plugins, no weird loaders
- You only pay the async price once at startup
- **Isolated in a separate module** — All the ESM mess is contained in `src/admin/` folder, keeping your main app clean

### Better project structure

By moving AdminJS into its own module (`src/admin/`), you get:
- **Separation of concerns** — AdminJS logic is isolated from your main app
- **Cleaner imports** — Your `AppModule` just imports `AdminModule`, not individual files
- **Standard NestJS patterns** — `main.ts` and `app.module.ts` look normal again
- **Easier to maintain** — All AdminJS-related code lives in one place

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

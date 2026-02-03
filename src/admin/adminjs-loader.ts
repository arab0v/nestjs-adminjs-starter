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

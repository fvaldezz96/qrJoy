import { connectMongo } from '../config/db';
import { createUser } from '../modules/auth/auth.service';
import { User } from '../modules/users/user.model';

async function run() {
  await connectMongo();

  const emailAdmin = 'admin@gmail.com';
  const emailUser = 'user@gmail.com';
  const emailEmployee = 'dazz.studio.25@gmail.com';

  const existsAdmin = await User.findOne({ email: emailAdmin });
  if (!existsAdmin) {
    await createUser({ email: emailAdmin, password: 'Admin123!', role: 'admin', name: 'Admin' });
    console.log('✅ Admin creado:', emailAdmin, '/ pass: Admin123!');
  } else {
    console.log('ℹ️ Admin ya existía');
  }

  const existsUser = await User.findOne({ email: emailUser });
  if (!existsUser) {
    await createUser({ email: emailUser, password: 'User123!', role: 'user', name: 'Usuario' });
    console.log('✅ Usuario creado:', emailUser, '/ pass: User123!');
  } else {
    console.log('ℹ️ Usuario ya existía');
  }

  if (!emailEmployee) {
    await createUser({
      email: emailEmployee,
      password: 'Admin123!',
      role: 'employee',
      name: 'Employee',
    });
    console.log('✅ Employee creado:', emailEmployee, '/ pass: Employee123!');
  } else {
    console.log('ℹ️ Employee ya existía');
  }

  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});

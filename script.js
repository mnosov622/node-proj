import sequelize from './config/db.js';
import User from './models/user.js';

async function createUser(name, email) {
  try {
    const newUser = await User.create({
      name: name,
      email: email,
    });
    console.log(`✅ Пользователь ${name} создан:`, newUser.toJSON());
  } catch (error) {
    console.error('❌ Ошибка создания пользователя:', error.message);
  }
}

async function readUsers() {
  try {
    // 1. Найти всех пользователей
    const allUsers = await User.findAll();
    console.log('\n--- Все пользователи ---');
    allUsers.forEach((user) => console.log(user.toJSON()));

    // 2. Найти одного пользователя по email
    const user = await User.findOne({
      where: { email: 'alice@example.com' }, // Условие поиска
    });
    if (user) {
      console.log('\n--- Пользователь Alice найден ---');
      console.log(user.toJSON());
    }
  } catch (error) {
    console.error('Ошибка чтения пользователей:', error.message);
  }
}

async function updateUserEmail(oldEmail, newEmail) {
  try {
    // Обновляем email, ищем по старому email
    const [updatedRowsCount] = await User.update(
      { email: newEmail }, // Новые данные
      { where: { email: oldEmail } } // Условие
    );

    if (updatedRowsCount > 0) {
      console.log(`\n✅ Обновлено ${updatedRowsCount} записей. Email изменен на ${newEmail}.`);

      // Проверим, что данные действительно изменились
      const updatedUser = await User.findOne({ where: { email: newEmail } });
      console.log('Обновленный пользователь:', updatedUser.toJSON());
    } else {
      console.log('\n🤷‍♂️ Пользователь не найден для обновления.');
    }
  } catch (error) {
    console.error('❌ Ошибка обновления:', error.message);
  }
}

// await updateUserEmail('alice@example.com', 'alice.smith@example.com');

async function deleteUserByEmail(email) {
  try {
    const deletedRowsCount = await User.destroy({
      where: { email: email }, // Условие, обязательно!
    });

    if (deletedRowsCount > 0) {
      console.log(`\n✅ Пользователь с email ${email} удален.`);
      // Проверим, что пользователь действительно удален
      const deletedUser = await User.findOne({ where: { email: email } });
      console.log(
        'Проверка:',
        deletedUser ? 'Пользователь не удален!' : 'Пользователь не найден (успешно удален)'
      );
    } else {
      console.log('\n🤷‍♂️ Пользователь не найден для удаления.');
    }
  } catch (error) {
    console.error('❌ Ошибка удаления:', error.message);
  }
}

// await deleteUserByEmail('bob@example.com');

async function updateAndDeleteUser() {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findOne({
      where: { email: 'alice.smith@example.com' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!user) {
      console.log("\n🤷‍♂️ Пользователь с email 'alice.smith@example.com' не найден.");
      await transaction.rollback();
      return;
    }

    user.name = 'Alicia Smith';
    await user.save({ transaction });

    await user.destroy({ transaction });
    await transaction.commit();

    console.log("\n✅ Пользователь 'alice.smith@example.com' обновлен и удален.");
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Ошибка updateAndDeleteUser():', error.message);
  }
}

async function main() {
  const command = process.argv[2];

  if (command === 'updateAndDeleteUser') {
    await updateAndDeleteUser();
    return;
  }

  //   await createUser('Alice', 'alice@example.com');
  //   await createUser('Bob', 'bob@example.com');
  await readUsers();
}

try {
  await main();
} finally {
  await sequelize.close();
}

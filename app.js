// app.js
import express from 'express';
import sequelize from './config/db.js';
import { User, Post } from './models/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

app.get('/', (req, res) => {
  res.send('Hello, Sequelize with Express! V2');
});

// --- Users ---

app.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.json(users);
  })
);

app.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  })
);

app.get(
  '/users/by-email/:email',
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ where: { email: req.params.email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  })
);

app.post(
  '/users',
  asyncHandler(async (req, res) => {
    const { name, email } = req.body ?? {};
    if (!name || !email) return res.status(400).json({ error: '`name` and `email` are required' });
    const user = await User.create({ name, email });
    res.status(201).json(user);
  })
);

app.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { name, email } = req.body ?? {};
    if (!name && !email) {
      return res.status(400).json({ error: 'Provide at least one of: `name`, `email`' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();

    res.json(user);
  })
);

app.patch(
  '/users/by-email/:email',
  asyncHandler(async (req, res) => {
    const { name, email: newEmail } = req.body ?? {};
    if (!name && !newEmail) {
      return res.status(400).json({ error: 'Provide at least one of: `name`, `email`' });
    }

    const user = await User.findOne({ where: { email: req.params.email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (newEmail) user.email = newEmail;
    await user.save();

    res.json(user);
  })
);

app.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const deletedRowsCount = await User.destroy({ where: { id: req.params.id } });
    if (deletedRowsCount === 0) return res.status(404).json({ error: 'User not found' });
    res.status(204).end();
  })
);

app.delete(
  '/users/by-email/:email',
  asyncHandler(async (req, res) => {
    const deletedRowsCount = await User.destroy({ where: { email: req.params.email } });
    if (deletedRowsCount === 0) return res.status(404).json({ error: 'User not found' });
    res.status(204).end();
  })
);

// Демонстрация логики из script.js: обновить в транзакции и удалить.
app.post(
  '/users/by-email/:email/update-and-delete',
  asyncHandler(async (req, res) => {
    const { name } = req.body ?? {};
    if (!name) return res.status(400).json({ error: '`name` is required' });

    const transaction = await sequelize.transaction();
    try {
      const user = await User.findOne({
        where: { email: req.params.email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({ error: 'User not found' });
      }

      user.name = name;
      await user.save({ transaction });
      await user.destroy({ transaction });
      await transaction.commit();

      res.json({ ok: true });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

// --- Posts ---

app.get(
  '/posts',
  asyncHandler(async (req, res) => {
    const posts = await Post.findAll();
    res.json(posts);
  })
);

app.get(
  '/posts/:id',
  asyncHandler(async (req, res) => {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  })
);

app.post(
  '/posts',
  asyncHandler(async (req, res) => {
    const { title, content, userId } = req.body ?? {};
    if (!title || !content || !userId) {
      return res.status(400).json({ error: '`title`, `content`, `userId` are required' });
    }
    const post = await Post.create({ title, content, userId });
    res.status(201).json(post);
  })
);

app.patch(
  '/posts/:id',
  asyncHandler(async (req, res) => {
    const { title, content, userId } = req.body ?? {};
    if (!title && !content && !userId) {
      return res
        .status(400)
        .json({ error: 'Provide at least one of: `title`, `content`, `userId`' });
    }

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (title) post.title = title;
    if (content) post.content = content;
    if (userId) post.userId = userId;
    await post.save();

    res.json(post);
  })
);

app.delete(
  '/posts/:id',
  asyncHandler(async (req, res) => {
    const deletedRowsCount = await Post.destroy({ where: { id: req.params.id } });
    if (deletedRowsCount === 0) return res.status(404).json({ error: 'Post not found' });
    res.status(204).end();
  })
);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Internal Server Error' });
});

// Запуск сервера и подключение к базе данных
app.listen(PORT, async () => {
  try {
    await sequelize.authenticate(); // Проверка подключения к БД
    console.log('Connection to the database has been established successfully.');
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});

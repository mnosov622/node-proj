import User from './user.js';
import Post from './post.js';

// Устанавливаем связь Один ко Многим:
// 1) У Пользователя много Постов
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });

// 2) Пост принадлежит одному Пользователю
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Post };

// const userWithPosts = await User.findOne({
//     where: { id: 1 },
//     include: [{ model: Post, as: 'posts' }] // Загрузить связанные посты
// });

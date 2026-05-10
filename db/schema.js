import { mysqlTable, int, varchar, text } from 'drizzle-orm/mysql-core';

export const students = mysqlTable('students', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  course: int('course').notNull(),
  grades: text('grades').notNull().default('[]'),
  email: varchar('email', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }),
});

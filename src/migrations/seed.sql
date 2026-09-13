-- 1 环境配置（必须每条单独执行，不能合并）
SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

-- 6 users_roles 用户角色中间表（依赖user、roles）

INSERT IGNORE INTO `roles` (`id`, `name`) VALUES
(1, '管理员'),
(2, '普通用户'),
(3, '测试用户'),
(4, '测试角色1');

INSERT IGNORE INTO `menus` (`id`, `name`, `path`, `order`, `acl`) VALUES
(2, '用户管理', '/users', 1, 'read,create,delete,update,manage'),
(3, '日志管理', '/logs', 1, 'read,create,delete');

INSERT IGNORE INTO `role_menus` (`menusId`, `rolesId`) VALUES
(2, 2),
(3, 2);
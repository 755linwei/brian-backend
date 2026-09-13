import { MigrationInterface, QueryRunner } from 'typeorm';

export class seedBaseRolesMenus1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 插入角色，主键冲突则更新name
    await queryRunner.query(`
INSERT INTO \`roles\` (\`id\`, \`name\`) VALUES
(1, '管理员'),
(2, '普通用户'),
(3, '测试用户'),
(4, '测试角色1')
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
        `);

    // 插入菜单
    await queryRunner.query(`
INSERT INTO \`menus\` (\`id\`, \`name\`, \`path\`, \`order\`, \`acl\`) VALUES
(2, '用户管理', '/users', 1, 'read,create,delete,update,manage'),
(3, '日志管理', '/logs', 1, 'read,create,delete')
ON DUPLICATE KEY UPDATE 
\`name\` = VALUES(\`name\`),
\`path\` = VALUES(\`path\`),
\`order\` = VALUES(\`order\`),
\`acl\` = VALUES(\`acl\`);
        `);

    // 角色菜单中间表；先删除已有关联避免唯一主键冲突，再插入
    await queryRunner.query(`
DELETE FROM \`role_menus\` WHERE (\`rolesId\`,\`menusId\`) IN ((2,2),(2,3));
        `);
    await queryRunner.query(`
INSERT INTO \`role_menus\` (\`menusId\`, \`rolesId\`) VALUES
(2, 2),
(3, 2);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：删除本次迁移插入的数据
    await queryRunner.query(
      `DELETE FROM \`role_menus\` WHERE (\`rolesId\`,\`menusId\`) IN ((2,2),(2,3));`,
    );
    await queryRunner.query(`DELETE FROM \`menus\` WHERE id IN (2,3);`);
    await queryRunner.query(`DELETE FROM \`roles\` WHERE id IN (1,2,3,4);`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class initAllEntities1788082772092 implements MigrationInterface {
  name = 'initAllEntities1788082772092';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE \`logs\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`path\` varchar(255) NOT NULL,
                \`methods\` varchar(255) NOT NULL,
                \`data\` varchar(255) NOT NULL,
                \`result\` int NOT NULL,
                \`userId\` int NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            CREATE TABLE \`profile\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`gender\` int NULL,
                \`photo\` varchar(255) NULL,
                \`address\` varchar(255) NULL,
                \`userId\` int NULL,
                UNIQUE INDEX \`REL_a24972ebd73b106250713dcddd\` (\`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            CREATE TABLE \`user\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`username\` varchar(255) NOT NULL,
                \`password\` varchar(255) NOT NULL,
                UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            CREATE TABLE \`menus\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`path\` varchar(255) NOT NULL,
                \`order\` int NOT NULL DEFAULT '0',
                \`acl\` varchar(255) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            CREATE TABLE \`roles\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            CREATE TABLE \`users_roles\` (
                \`userId\` int NOT NULL,
                \`rolesId\` int NOT NULL,
                INDEX \`IDX_776b7cf9330802e5ef5a8fb18d\` (\`userId\`),
                INDEX \`IDX_21db462422f1f97519a29041da\` (\`rolesId\`),
                PRIMARY KEY (\`userId\`, \`rolesId\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            CREATE TABLE \`role_menus\` (
                \`rolesId\` int NOT NULL,
                \`menusId\` int NOT NULL,
                INDEX \`IDX_135e41fb3c98312c5f171fe9f1\` (\`rolesId\`),
                INDEX \`IDX_cf82e501e9b61eab5d815ae3b0\` (\`menusId\`),
                PRIMARY KEY (\`rolesId\`, \`menusId\`)
            ) ENGINE = InnoDB
        `);
    await queryRunner.query(`
            ALTER TABLE \`logs\`
            ADD CONSTRAINT \`FK_a1196a1956403417fe3a0343390\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`profile\`
            ADD CONSTRAINT \`FK_a24972ebd73b106250713dcddd9\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`users_roles\`
            ADD CONSTRAINT \`FK_776b7cf9330802e5ef5a8fb18dc\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE \`users_roles\`
            ADD CONSTRAINT \`FK_21db462422f1f97519a29041da0\` FOREIGN KEY (\`rolesId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE \`role_menus\`
            ADD CONSTRAINT \`FK_135e41fb3c98312c5f171fe9f1c\` FOREIGN KEY (\`rolesId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE \`role_menus\`
            ADD CONSTRAINT \`FK_cf82e501e9b61eab5d815ae3b0a\` FOREIGN KEY (\`menusId\`) REFERENCES \`menus\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`role_menus\` DROP FOREIGN KEY \`FK_cf82e501e9b61eab5d815ae3b0a\`
        `);
    await queryRunner.query(`
            ALTER TABLE \`role_menus\` DROP FOREIGN KEY \`FK_135e41fb3c98312c5f171fe9f1c\`
        `);
    await queryRunner.query(`
            ALTER TABLE \`users_roles\` DROP FOREIGN KEY \`FK_21db462422f1f97519a29041da0\`
        `);
    await queryRunner.query(`
            ALTER TABLE \`users_roles\` DROP FOREIGN KEY \`FK_776b7cf9330802e5ef5a8fb18dc\`
        `);
    await queryRunner.query(`
            ALTER TABLE \`profile\` DROP FOREIGN KEY \`FK_a24972ebd73b106250713dcddd9\`
        `);
    await queryRunner.query(`
            ALTER TABLE \`logs\` DROP FOREIGN KEY \`FK_a1196a1956403417fe3a0343390\`
        `);
    await queryRunner.query(`
            DROP INDEX \`IDX_cf82e501e9b61eab5d815ae3b0\` ON \`role_menus\`
        `);
    await queryRunner.query(`
            DROP INDEX \`IDX_135e41fb3c98312c5f171fe9f1\` ON \`role_menus\`
        `);
    await queryRunner.query(`
            DROP TABLE \`role_menus\`
        `);
    await queryRunner.query(`
            DROP INDEX \`IDX_21db462422f1f97519a29041da\` ON \`users_roles\`
        `);
    await queryRunner.query(`
            DROP INDEX \`IDX_776b7cf9330802e5ef5a8fb18d\` ON \`users_roles\`
        `);
    await queryRunner.query(`
            DROP TABLE \`users_roles\`
        `);
    await queryRunner.query(`
            DROP TABLE \`roles\`
        `);
    await queryRunner.query(`
            DROP TABLE \`menus\`
        `);
    await queryRunner.query(`
            DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\`
        `);
    await queryRunner.query(`
            DROP TABLE \`user\`
        `);
    await queryRunner.query(`
            DROP INDEX \`REL_a24972ebd73b106250713dcddd\` ON \`profile\`
        `);
    await queryRunner.query(`
            DROP TABLE \`profile\`
        `);
    await queryRunner.query(`
            DROP TABLE \`logs\`
        `);
  }
}

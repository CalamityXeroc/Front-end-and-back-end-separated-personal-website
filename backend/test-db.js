const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 测试数据库连接...\n');
  console.log('配置信息:');
  console.log(`  主机: ${process.env.DB_HOST}`);
  console.log(`  端口: ${process.env.DB_PORT}`);
  console.log(`  用户: ${process.env.DB_USER}`);
  console.log(`  数据库: ${process.env.DB_NAME}\n`);

  // 先连接到 postgres 默认数据库
  const defaultClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // 连接默认数据库
  });

  try {
    await defaultClient.connect();
    console.log('✅ 成功连接到 PostgreSQL 服务器\n');

    // 查询所有数据库
    const result = await defaultClient.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false;"
    );
    
    console.log('📋 现有数据库列表:');
    result.rows.forEach(row => {
      console.log(`  - ${row.datname}`);
    });

    const dbExists = result.rows.some(row => row.datname === process.env.DB_NAME);
    
    if (!dbExists) {
      console.log(`\n⚠️  数据库 "${process.env.DB_NAME}" 不存在`);
      console.log('正在创建数据库...');
      await defaultClient.query(`CREATE DATABASE ${process.env.DB_NAME};`);
      console.log('✅ 数据库创建成功！');
    } else {
      console.log(`\n✅ 数据库 "${process.env.DB_NAME}" 已存在`);
    }

    await defaultClient.end();
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

testConnection();

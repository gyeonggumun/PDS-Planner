const express = require('express');
const cors = require('cors');
const { requireScope } = require('./middleware');

const app = express();
app.use(cors());
app.use(express.json());

// 모든 API 라우트에 A/B 격리 미들웨어 적용
app.use('/api', requireScope);

app.get('/api/todos', (req, res) => {
  const owner = req.userScope;
  // TODO: 실제 db.js 연동 후 SELECT * FROM todos WHERE owner = ? 실행
  res.json({ message: `${owner} 범위의 할 일 목록입니다.` });
});

app.listen(3000, () => {
  console.log('백엔드 서버가 3000번 포트에서 실행 중입니다.');
});
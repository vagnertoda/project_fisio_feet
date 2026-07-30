const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// Garantir usuário demo fisioterapeuta
async function seedDefaultUser() {
  try {
    const res = await query('SELECT * FROM users WHERE username = ?', ['fisioterapeuta']);
    if (res.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('senha123', 10);
      await query(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        ['fisioterapeuta', hashedPassword, 'fisioterapeuta@fisiofeet.com.br']
      );
      console.log('👤 Usuário demo criado: fisioterapeuta / senha123');
    }
  } catch (err) {
    console.error('Erro ao verificar usuário demo:', err.message);
  }
}
setTimeout(seedDefaultUser, 1000);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const existing = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Nome de usuário já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email || '']
    );

    const newUserId = result.lastID || (result.rows && result.rows[0] ? result.rows[0].id : 1);
    const token = jwt.sign({ id: newUserId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: newUserId, username, email }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;

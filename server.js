const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/bankCalculators')
   .then(() => console.log('Connected to MongoDB'))
   .catch(err => console.error('Could not connect to MongoDB', err)
);

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});

const Calculator = require('./models/Calculator');

app.post('/api/calculate', async (req, res) => {
   const { type, rate, principal, downPayment, duration, email } = req.body;
   const loanAmount = principal - downPayment;
   const monthlyRate = rate / 12 / 100;
   const totalRate = Math.pow(1 + monthlyRate, duration * 12);

   const monthlyPayment = loanAmount * monthlyRate * totalRate / (totalRate - 1);

   const calculation = new Calculator({
      type,
      rate,
      duration,
      result: monthlyPayment,
      email,
   });
   await calculation.save();

   res.json({ monthlyPayment });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const authMiddleware = (req, res, next) => {
   const token = req.headers['authorization'];
   console.log(token.split(' ')[1]);
   if (!token) return res.status(402).json({ message: 'Access denied' });
   jwt.verify(token.split(' ')[1], 'secretKey', (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      req.user = decoded;
      next();
   });
};

const User = require('./models/User');

app.get('/api/admin/calculations', authMiddleware, async (req, res) => {
    const user = await User.findOne({ _id: req.user.id});
    console.log(user);
    if (user.role !== 'admin') {
       return res.status(405).json({ message: 'Forbidden' });
    }
    const calculations = await Calculator.find();
    res.json(calculations);
 });


app.post('/api/auto-loan/calculate', async (req, res) => {
   const { type = 'auto-loan', rate, carPrice, downPayment, duration, email } = req.body;
    console.log(req.body);
   // Сумма кредита
   const loanAmount = carPrice - downPayment;
   console.log(loanAmount);
   // Ежемесячная процентная ставка
   const monthlyRate = rate / 12 / 100;
   console.log(loanAmount);

   // Общая ставка
   const totalRate = Math.pow(1 + monthlyRate, duration * 12);
   console.log(totalRate);

   // Ежемесячный платеж
   const monthlyPayment = loanAmount * monthlyRate * totalRate / (totalRate - 1);
   console.log(monthlyPayment);

   // Сохранение результата в базе данных
   const calculation = new Calculator({
      type,
      rate,
      duration,
      result: monthlyPayment,
      email,
   });
   await calculation.save();

   res.json({ monthlyPayment });
});

app.post('/api/consumer-loan/calculate', async (req, res) => {
    const { type = 'consumer-loan', rate, principal, duration, email } = req.body;
 
    // Ежемесячная процентная ставка
    const monthlyRate = rate / 12 / 100;
 
    // Общая ставка
    const totalRate = Math.pow(1 + monthlyRate, duration * 12);
 
    // Ежемесячный платеж
    const monthlyPayment = principal * monthlyRate * totalRate / (totalRate - 1);
 
    // Сохранение результата в базу данных
    const calculation = new Calculator({
       type,
       rate,
       duration,
       result: monthlyPayment,
       email,
    });
 
    try {
       await calculation.save();
       res.json({ monthlyPayment });
    } catch (err) {
       res.status(500).json({ error: 'Ошибка сохранения результата в базу данных' });
    }
 });
 
 
 
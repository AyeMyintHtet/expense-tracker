const toDate = (dateLike) => new Date(dateLike);

const isValidDate = (dateLike) => {
  const parsed = toDate(dateLike);
  return !Number.isNaN(parsed.getTime());
};

export const getMonthStart = (dateLike) => {
  const date = toDate(dateLike);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getMonthEnd = (dateLike) => {
  const date = toDate(dateLike);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
};

const isWithinRange = (dateLike, startDate, endDate) => {
  const date = toDate(dateLike);
  return date >= startDate && date < endDate;
};

const isExpenseTransaction = (tx) => Number(tx.amount) < 0;

export const normalizeTransactions = (transactions) => {
  return transactions
    .map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
      date: tx.date ?? new Date().toISOString(),
    }))
    .filter((tx) => Number.isFinite(tx.amount) && isValidDate(tx.date));
};

export const getSortedTransactions = (transactions) => {
  return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const sumTransactionsBetween = (transactions, startDate, endDate) => {
  return transactions.reduce((sum, tx) => {
    const txDate = new Date(tx.date);
    if (txDate >= startDate && txDate < endDate) {
      return sum + tx.amount;
    }

    return sum;
  }, 0);
};

export const calculateTotalBalance = (transactions) => {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
};

export const calculatePercentChangeCurrentVsPreviousMonth = (
  transactions,
  now = new Date(),
) => {
  const currentMonthStart = getMonthStart(now);
  const nextMonthStart = getMonthEnd(now);
  const previousMonthStart = getMonthStart(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );

  const currentMonthTotal = sumTransactionsBetween(
    transactions,
    currentMonthStart,
    nextMonthStart,
  );
  const previousMonthTotal = sumTransactionsBetween(
    transactions,
    previousMonthStart,
    currentMonthStart,
  );

  if (previousMonthTotal === 0) {
    return currentMonthTotal === 0 ? 0 : 100;
  }

  const change = ((currentMonthTotal - previousMonthTotal) / Math.abs(previousMonthTotal)) * 100;
  return Number(change.toFixed(1));
};

const getDateKey = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

export const buildWeeklyExpense = (transactions, now = new Date(), days = 7) => {
  const buckets = [];

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
    buckets.push({
      key: getDateKey(date),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      amount: 0,
    });
  }

  const bucketByDateKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  transactions.forEach((tx) => {
    if (tx.amount >= 0) return;

    const key = getDateKey(tx.date);
    if (!key) return;

    const bucket = bucketByDateKey.get(key);
    if (bucket) {
      bucket.amount += Math.abs(tx.amount);
    }
  });

  return buckets.map(({ day, amount }) => ({
    day,
    amount: Number(amount.toFixed(2)),
  }));
};

export const calculateMonthSummary = (transactions, date = new Date()) => {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);

  const monthTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= monthStart && txDate < monthEnd;
  });

  const income = monthTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = monthTransactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return {
    income: Number(income.toFixed(2)),
    expense: Number(expense.toFixed(2)),
    net: Number((income - expense).toFixed(2)),
    count: monthTransactions.length,
  };
};

export const getMonthExpenseTransactions = (transactions, date = new Date()) => {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);

  return transactions.filter((tx) => {
    return isExpenseTransaction(tx) && isWithinRange(tx.date, monthStart, monthEnd);
  });
};

export const calculateAverageDailyExpense = (transactions, date = new Date()) => {
  const expenseTransactions = getMonthExpenseTransactions(transactions, date);
  const expenseTotal = expenseTransactions
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const activeExpenseDays = new Set(
    expenseTransactions
      .map((tx) => getDateKey(tx.date))
      .filter(Boolean),
  ).size;

  const divisor = Math.max(1, activeExpenseDays);
  return Number((expenseTotal / divisor).toFixed(2));
};

export const buildCategoryBreakdown = (transactions, date = new Date(), limit = 5) => {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);

  const totals = new Map();
  let expenseTotal = 0;

  transactions.forEach((tx) => {
    if (tx.amount >= 0) return;

    const txDate = new Date(tx.date);
    if (txDate < monthStart || txDate >= monthEnd) return;

    const category = tx.category || 'General';
    const amount = Math.abs(tx.amount);
    totals.set(category, (totals.get(category) || 0) + amount);
    expenseTotal += amount;
  });

  if (expenseTotal === 0) return [];

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percent: Number(((amount / expenseTotal) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
};

export const buildMonthlyReports = (transactions, months = 6, now = new Date()) => {
  const reports = [];

  for (let offset = 0; offset < months; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const summary = calculateMonthSummary(transactions, date);
    reports.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      ...summary,
    });
  }

  return reports;
};

export const findLargestExpense = (transactions) => {
  return transactions
    .filter((tx) => tx.amount < 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0] || null;
};

export const findLargestIncome = (transactions) => {
  return transactions
    .filter((tx) => tx.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0] || null;
};

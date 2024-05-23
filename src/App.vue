<template>
<Header/>
<div class="container">
  <Balance :total="total"/>
  <IncomeExpenses :income="+income" :expenses="+expenses"/>
  <TransactionList :transactions="transactions" @transactionDeleted="handleTransactionDeleted"/>
  <AddTransaction @transactionSubmitted="handleTransactionSubmitted"/>
</div>
</template>

<script setup>
import Header from './components/Header.vue';
import Balance from './components/Balance.vue';
import IncomeExpenses from './components/IncomeExpenses.vue';
import TransactionList from './components/TransactionList.vue';
import AddTransaction from './components/AddTransaction.vue';


import {computed, ref,onMounted} from 'vue'
import {useToast} from 'vue-toastification'

const toast = useToast();
const transactions = ref([]);

onMounted(()=>{

  transactions.value= JSON.parse(localStorage.getItem('transactions')) || [];


})

const  total = computed(()=>{
  return transactions.value.reduce((total, transaction) => total + transaction.amount, 0)
})

const income = computed(()=>{
  return transactions.value.filter(transaction => transaction.amount > 0).reduce((total, transaction) => total + transaction.amount, 0).toFixed(2)
})
const expenses = computed(()=>{
  return transactions.value.filter(transaction => transaction.amount < 0).reduce((total, transaction) => total + transaction.amount, 0).toFixed(2)
})

const handleTransactionSubmitted = (transactionData)=>{
  console.log(transactionData,'transactionData')
  // console.log(transactions.value,'transactions.value')
  transactions.value.push({
    id: generateUniqueID(),
    text: transactionData.text,
    amount: transactionData.amount
  })
  saveTransactionToLocalStorage()
  toast.success('Transaction Added')
}
const handleTransactionDeleted = (id)=>{
  transactions.value = transactions.value.filter((transaction)=> transaction.id !== id)
  saveTransactionToLocalStorage()

  toast.success('Transaction Deleted')
}

const saveTransactionToLocalStorage = ()=>{
  localStorage.setItem('transactions', JSON.stringify(transactions.value))
}
const generateUniqueID = ()=>{
  return Math.floor(Math.random() * 1000000000) + 1;
}
</script>
<template>
    <h3 v-show="transactions.length >0 ? true : false">History</h3>
      <ul id="list" class="list">

        <li v-for="transaction in transactions" :key="transaction.id" :class="transaction.amount < 0 ? 'minus' : 'plus'">
            {{transaction.text}} <span>${{transaction.amount}}</span><button class="delete-btn" @click="deleteTransaction(transaction.id)">x</button>
        </li>

      </ul>
</template>

<script setup>
import { defineProps } from 'vue';

const emit = defineEmits(['transactionDeleted'])

const props = defineProps({
    transactions: {
        type: Array,
        required: true
    }
})
const deleteTransaction = (id)=>{
    emit('transactionDeleted',id)
}
</script>